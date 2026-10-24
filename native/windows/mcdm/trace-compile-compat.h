/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_WPP_TRACING
TAG: LEEWAY_WINDOWS_WPP_CORRECT_LEVEL_FLAGS_AND_ETW_V1
WHO: Owner-authorized LeeWay GPU driver engineering.
WHAT: Bridge old sample's Windows WPP logging to the supported WDK compiler.
WHEN: 2026-10-24. WHERE: native/windows/mcdm.
WHY: Compile complete KMD source with real WPP tracing, not logging stubs.
HOW: Microsoft WPP_LEVEL_FLAGS macros and exact documented ETW numeric constants.
AUTHORITY: COMPILE_ONLY; no weakened logging, no kernel installation.
LICENSE: Existing LeeWay terms; Microsoft original source stays unmodified.
*/
#pragma once
#include <evntrace.h>
#ifndef EVENT_CONTROL_CODE_DISABLE_PROVIDER
#define EVENT_CONTROL_CODE_DISABLE_PROVIDER 0
#endif
#ifndef EVENT_CONTROL_CODE_ENABLE_PROVIDER
#define EVENT_CONTROL_CODE_ENABLE_PROVIDER 1
#endif
#ifndef TRACE_LEVEL_CRITICAL
#define TRACE_LEVEL_CRITICAL 1
#endif
#ifndef TRACE_LEVEL_ERROR
#define TRACE_LEVEL_ERROR 2
#endif
#ifndef TRACE_LEVEL_WARNING
#define TRACE_LEVEL_WARNING 3
#endif
#ifndef TRACE_LEVEL_INFORMATION
#define TRACE_LEVEL_INFORMATION 4
#endif
#ifndef TRACE_LEVEL_VERBOSE
#define TRACE_LEVEL_VERBOSE 5
#endif
#ifndef WPP_LEVEL_FLAGS_LOGGER
#define WPP_LEVEL_FLAGS_LOGGER(lvl,flags) WPP_LEVEL_LOGGER(flags)
#endif
#ifndef WPP_LEVEL_FLAGS_ENABLED
#define WPP_LEVEL_FLAGS_ENABLED(lvl,flags) (WPP_LEVEL_ENABLED(flags) && WPP_CONTROL(WPP_BIT_ ## flags).Level >= (lvl))
#endif
