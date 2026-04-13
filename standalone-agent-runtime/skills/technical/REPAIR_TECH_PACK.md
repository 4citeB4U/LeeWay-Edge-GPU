# SKILL: technical.diagnose.device_failure

## PURPOSE
To perform a deterministic diagnostic sweep of a local or connected IoT device.

## WORKFLOW
1. **Identify Hardware**: Extract Serial/Model info from device interface.
2. **Log Scan**: Search for "Error", "Critical", or "Warning" in system logs.
3. **Power Audit**: Check battery health and voltage stability.
4. **Performance Baseline**: Compare current CPU/Memory usage against the "Factory Default" baseline.
5. **Fault Isolation**: Disable sub-modules one by one to identify the failing component.
6. **Solution Map**: Match detected fault to a "Repair Guide" in the local library.

---

# SKILL: technical.os.performance_tune

## PURPOSE
To restore system speed to a machine showing high latency or bloat.

## ACTIONS
- **scan_processes**: Identify CPU-heavy background tasks.
- **clear_cache**: Remove temporary system/browser junk files.
- **optimize_startup**: Disable non-essential startup items.
- **registry_audit**: (Windows Only) Clean orphan entries.

---

# SKILL: technical.iot.reconnect_mesh

## PURPOSE
To troubleshoot and repair a broken connection between home/office devices and the central hub.
