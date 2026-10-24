/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.WDDM
TAG: LEEWAY_WDDM_REAL_DXGKRNL_BOOTSTRAP_FAIL_CLOSED_V1
WHO: LeeWay owner-authorized engineering.
WHAT: Compile the actual Windows graphics-kernel DxgkInitialize entry contract.
WHY: OS recognition needs a real WDDM KMD/UMD stack, never a label-only INF.
WHERE: native/windows/wddm.
WHEN: 2026-10-24.
HOW: Exact WDK typed callbacks, deliberate fail-closed device-admission.
AUTHORITY: SOURCE ONLY; not a completed KMD, not installable, do not start.
LICENSE: Existing LeeWay repository terms.
*/
#include <ntddk.h>
#include <dispmprt.h>

// A structural WDDM bootstrap, not a registration or operational driver.
// The REQUIRED DXGKDDI_* callback set from the Microsoft WDDM requirements
// is NOT complete. Until it is, DriverEntry must NOT call DxgkInitialize.
// This prevents a partially wired KMD from touching the host display stack.
// Independent tests can compile and inspect the source safely.

static NTSTATUS NTAPI LeeWayAddDevice(
    IN_CONST_PDEVICE_OBJECT physicalDeviceObject,
    OUT_PPVOID miniportDeviceContext) {
  UNREFERENCED_PARAMETER(physicalDeviceObject);
  if (!miniportDeviceContext) return STATUS_INVALID_PARAMETER;
  *miniportDeviceContext = NULL;
  return STATUS_NOT_SUPPORTED;
}

static NTSTATUS NTAPI LeeWayStartDevice(
    IN_CONST_PVOID miniportDeviceContext,
    IN_PDXGK_START_INFO startInfo,
    IN_PDXGKRNL_INTERFACE interface,
    OUT_PULONG presentSources,
    OUT_PULONG children) {
  UNREFERENCED_PARAMETER(miniportDeviceContext);
  UNREFERENCED_PARAMETER(startInfo);
  UNREFERENCED_PARAMETER(interface);
  if (presentSources) *presentSources = 0;
  if (children) *children = 0;
  return STATUS_NOT_SUPPORTED;
}

static NTSTATUS NTAPI LeeWayStopDevice(IN_CONST_PVOID miniportDeviceContext) {
  UNREFERENCED_PARAMETER(miniportDeviceContext);
  return STATUS_NOT_SUPPORTED;
}

static NTSTATUS NTAPI LeeWayRemoveDevice(IN_CONST_PVOID miniportDeviceContext) {
  UNREFERENCED_PARAMETER(miniportDeviceContext);
  return STATUS_NOT_SUPPORTED;
}

static VOID NTAPI LeeWayUnload(VOID) { }

// Force the compiler to check signatures against the real installed WDK
// rather than declaring an invented proprietary graphics-kernel API.
static PDXGKDDI_ADD_DEVICE const kLeeWayAddDeviceSignature = LeeWayAddDevice;
static PDXGKDDI_START_DEVICE const kLeeWayStartDeviceSignature = LeeWayStartDevice;
static PDXGKDDI_STOP_DEVICE const kLeeWayStopDeviceSignature = LeeWayStopDevice;
static PDXGKDDI_REMOVE_DEVICE const kLeeWayRemoveDeviceSignature = LeeWayRemoveDevice;
static PDXGKDDI_UNLOAD const kLeeWayUnloadSignature = LeeWayUnload;

// No software graphics DLL can be called from kernel mode. Future WDDM
// UMD resolves LDWMD user-mode memory and invokes leeway-swgraphics;
// KMD must independently implement real graphics scheduling/isolation DDIs.
NTSTATUS NTAPI DriverEntry(
    PDRIVER_OBJECT driverObject, PUNICODE_STRING registryPath) {
  DRIVER_INITIALIZATION_DATA callbacks = {0};
  if (!driverObject || !registryPath) return STATUS_INVALID_PARAMETER;
  callbacks.Version = DXGKDDI_INTERFACE_VERSION;
  callbacks.DxgkDdiAddDevice = kLeeWayAddDeviceSignature;
  callbacks.DxgkDdiStartDevice = kLeeWayStartDeviceSignature;
  callbacks.DxgkDdiStopDevice = kLeeWayStopDeviceSignature;
  callbacks.DxgkDdiRemoveDevice = kLeeWayRemoveDeviceSignature;
  callbacks.DxgkDdiUnload = kLeeWayUnloadSignature;
  // No DxgkInitialize call until the complete WDDM DDI set and a real,
  // independently tested adapter PnP topology exist.
  UNREFERENCED_PARAMETER(callbacks);
  return STATUS_NOT_SUPPORTED;
}
