"""Real GPU readback and unsupported-path checks; no simulated tensor kernels."""
import gc
import os
import subprocess
import sys
import unittest
import torch
import leeway_edge_gpu as leeway

if os.getenv("LEEWAY_REQUIRE_GPU") == "1" and not leeway.is_available():
    raise RuntimeError(f"Required physical Leeway Edge GPU adapter unavailable: {leeway.status()}")


class DiscoveryTests(unittest.TestCase):
    def test_registration_and_authority_state(self):
        self.assertIs(torch.leeway, leeway)
        self.assertEqual(torch.device("leeway:0").type, "leeway")
        self.assertEqual(torch._C._get_privateuse1_backend_name(), "leeway")
        self.assertFalse(torch.ones(1).is_leeway)
        status = leeway.status()
        self.assertEqual(status["name"], "Leeway Edge GPU")
        self.assertFalse(status["production_dispatch_authorized"])
        self.assertFalse(status["canonical_receipt_issued"])
        self.assertFalse(status["cpu_compute_fallback"])

    def test_backend_collision_is_rejected(self):
        code = "import torch; torch.utils.rename_privateuse1_backend('occupied'); import leeway_edge_gpu"
        result = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("owned by 'occupied'", result.stderr)

    def test_other_device_is_rejected(self):
        with self.assertRaises(ValueError):
            leeway.set_device("cpu")
        with self.assertRaises(ValueError):
            leeway.set_device(1)

    def test_known_software_renderer_is_rejected_even_without_dxgi_flag(self):
        if leeway._native is None:
            self.skipTest("native adapter cannot load on this host")
        predicate = leeway._native.adapter_is_eligible
        # Captured Windows CI identity. It incorrectly arrived with Flags==0.
        self.assertFalse(predicate("Microsoft Basic Render Driver", 0x1414, 0x008c, 0))
        self.assertFalse(predicate("Localized renderer name", 0x1414, 0x008c, 0))
        self.assertFalse(predicate("Unknown software adapter", 0, 0, 2))
        self.assertFalse(predicate("Remote adapter", 0x10de, 0, 1))
        # These are classification fixtures, never execution evidence.
        self.assertTrue(predicate("NVIDIA fixture", 0x10de, 0, 0))
        self.assertTrue(predicate("Intel fixture", 0x8086, 0, 0))

    def test_unavailable_is_honest(self):
        if leeway.is_available():
            self.skipTest("physical GPU is available")
        self.assertEqual(leeway.device_count(), 0)
        with self.assertRaises(RuntimeError):
            leeway.get_device_properties()
        with self.assertRaises(RuntimeError):
            torch.ones(1, device="leeway")


@unittest.skipUnless(leeway.is_available(), "physical D3D12 GPU/native extension unavailable")
class PhysicalGPUChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\nLeeway Edge GPU adapter:", leeway.get_device_properties(), flush=True)

    @classmethod
    def tearDownClass(cls):
        gc.collect()
        leeway.synchronize()
        print("Leeway Edge GPU final statistics:", leeway.status()["statistics"], flush=True)

    def test_properties_and_real_transfer(self):
        props = leeway.get_device_properties()
        self.assertEqual(props["name"], "Leeway Edge GPU")
        self.assertEqual(props["runtime"], "D3D12")
        self.assertFalse(props["software_adapter"])
        self.assertTrue(props["adapter_name"])
        self.assertEqual(leeway.current_device(), 0)
        with torch.inference_mode():
            source = torch.arange(12, dtype=torch.float32).reshape(3, 4)
            device = source.to("leeway")
            self.assertEqual(str(device.device), "leeway:0")
            torch.testing.assert_close(device.cpu(), source, rtol=0, atol=0)

    def test_rectangular_matmul_and_partial_tiles(self):
        generator = torch.Generator().manual_seed(27)
        with torch.inference_mode():
            a = torch.randn((17, 9), generator=generator)
            b = torch.randn((9, 13), generator=generator)
            before = leeway.status()["statistics"]["gpu_dispatches"]
            out = a.to("leeway") @ b.to("leeway")
            self.assertEqual(out.device.type, "leeway")
            torch.testing.assert_close(out.cpu(), a @ b, rtol=1e-4, atol=1e-5)
            self.assertEqual(leeway.status()["statistics"]["gpu_dispatches"], before + 1)

    def test_gpu_fill_and_larger_matmul(self):
        with torch.inference_mode():
            a = torch.ones((64, 128), device="leeway")
            b = torch.ones((128, 33), device="leeway")
            result = a @ b
            leeway.synchronize()
            torch.testing.assert_close(result.cpu(), torch.full((64, 33), 128.0), rtol=0, atol=0)
            torch.testing.assert_close(torch.zeros(257, device="leeway").cpu(), torch.zeros(257))

    def test_empty_inner_dimension(self):
        with torch.inference_mode():
            a = torch.empty((3, 0), device="leeway")
            b = torch.empty((0, 5), device="leeway")
            torch.testing.assert_close((a @ b).cpu(), torch.zeros((3, 5)), rtol=0, atol=0)

    def test_add_mul_relu_and_gpu_copy(self):
        with torch.inference_mode():
            a = torch.tensor([-4.0, -2.0, 0.0, 2.0, 4.0])
            b = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0])
            ga, gb = a.to("leeway"), b.to("leeway")
            torch.testing.assert_close(torch.add(ga, gb, alpha=2).cpu(), a + 2*b)
            torch.testing.assert_close((ga * gb).cpu(), a * b)
            torch.testing.assert_close(torch.relu(ga).cpu(), torch.relu(a))
            copied = torch.empty_like(ga)
            copied.copy_(ga)
            torch.testing.assert_close(copied.cpu(), a)

    def test_unsupported_operator_never_falls_back(self):
        with torch.inference_mode():
            x = torch.ones(8, device="leeway")
            before = leeway.status()["statistics"]
            with self.assertRaisesRegex(RuntimeError, "CPU compute fallback is disabled"):
                torch.sin(x)
            self.assertEqual(before, leeway.status()["statistics"])

    def test_dtype_shape_and_budget_rejections(self):
        with torch.inference_mode():
            with self.assertRaisesRegex(RuntimeError, "only float32"):
                torch.empty(4, dtype=torch.float64, device="leeway")
            with self.assertRaisesRegex(RuntimeError, "tensor budget"):
                torch.empty((4096, 4096), device="leeway")
            with self.assertRaisesRegex(RuntimeError, "noncontiguous"):
                torch.empty_strided((2, 3), (1, 2), device="leeway")
            a = torch.ones((2, 3), device="leeway")
            b = torch.ones((4, 2), device="leeway")
            with self.assertRaises(RuntimeError):
                a @ b
            with self.assertRaisesRegex(RuntimeError, "broadcasting"):
                a + torch.ones((1, 3), device="leeway")
            with self.assertRaisesRegex(RuntimeError, "asynchronous"):
                torch.ones(3).to("leeway", non_blocking=True)

    def test_allocations_are_released(self):
        gc.collect()
        before = leeway.memory_allocated()
        with torch.inference_mode():
            value = torch.ones(1024, device="leeway")
            self.assertEqual(leeway.memory_allocated(), before + 4096)
            del value
        gc.collect()
        self.assertEqual(leeway.memory_allocated(), before)

    def test_process_shutdown_with_live_tensor(self):
        code = "import torch, leeway_edge_gpu; value=torch.ones(8, device='leeway'); print(value.cpu())"
        result = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
