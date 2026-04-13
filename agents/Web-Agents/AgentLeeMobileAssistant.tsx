/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.AGENTLEEMOBILEASSISTANT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = AgentLeeMobileAssistant module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\AgentLeeMobileAssistant.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AgentLeeMobileAssistant provides a unified interface combining the offline
 * voice assistant with the memory lake database hub.  It is designed for
 * mobile devices and lightweight embedded systems such as Raspberry Pi.
 * The component arranges the voice interface at the top of the page and
 * the data management hub below, allowing the user to issue spoken
 * commands and then interact with visual tools.  All features operate
 * completely offline.
 */

import React from 'react';
import VoiceAssistant from './VoiceAssistant';
import AgentLeesDatabaseHub from './AgentLeesDatabaseHub';

const AgentLeeMobileAssistant: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#030410', color: '#fff', minHeight: '100vh' }}>
      {/* Voice Assistant */}
      <section style={{ padding: '1rem', borderBottom: '1px solid #222' }}>
        <VoiceAssistant />
      </section>
      {/* Database and Memory Lake Hub */}
      <section style={{ padding: '1rem' }}>
        <AgentLeesDatabaseHub />
      </section>
    </div>
  );
};

export default AgentLeeMobileAssistant;