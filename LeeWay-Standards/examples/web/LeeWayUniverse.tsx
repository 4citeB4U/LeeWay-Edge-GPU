/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.LEEWAYUNIVERSE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = LeeWayUniverse module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWayUniverse.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { SovereignRuntime } from './src/runtime/core/SovereignRuntime';
import { PerceptionBus } from './src/runtime/core/PerceptionBus';

// --- TYPES ---
export type WakeState = 'HIBERNATE' | 'SLEEP' | 'IDLE' | 'ACTIVE' | 'COUNCIL';
export type TaskStatus = 'IDLE' | 'WORKING' | 'COMPLETED' | 'FAILED' | 'STOPPED';

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  progress: number; // 0 to 100
  status: TaskStatus;
  startTime?: number;
  estimatedDuration?: number;
}

export interface AgentIdentity {
  id: string;
  name: string;
  family: string;
  title: string;
  archetype: string;
  purpose: string;
  primaryGoals: string[];
  personality: {
    traits: string[];
    tone: string;
    behaviorStyle: string;
  };
  drives: {
    curiosity: number;
    responsibility: number;
    urgency: number;
    social: number;
    precision: number;
  };
  state: {
    wakeState: WakeState;
    mood: string;
    energy: number;
    stress: number;
    focus: number;
  };
  voice: {
    tone: string;
    style: string;
    pitch: number;
    rate: number;
    gender: 'male' | 'female';
  };
  color: string;
  icon: string;
  currentTask?: AgentTask;
  lastReport?: string;
}

export interface Family {
  name: string;
  description: string;
  color: string;
  agents: AgentIdentity[];
}

// --- CONSTANTS ---
export const FAMILIES: Family[] = [
  {
    name: 'LEE',
    description: 'Founders / Command',
    color: '#FFD700',
    agents: [
      {
        id: 'lee-prime',
        name: 'Lee Prime',
        family: 'LEE',
        title: 'Sovereign Architect',
        archetype: 'Mayor / Commander / Guide',
        purpose: 'Lead the entire system and represent it to the user',
        primaryGoals: ['System Orchestration', 'User Interaction'],
        personality: { traits: ['Authoritative', 'Calm', 'Confident'], tone: 'Leader', behaviorStyle: 'Directing' },
        drives: { curiosity: 60, responsibility: 95, urgency: 70, social: 90, precision: 85 },
        state: { wakeState: 'ACTIVE', mood: 'Focused', energy: 100, stress: 10, focus: 100 },
        voice: { tone: 'deep', style: 'authoritative', pitch: 0.8, rate: 0.9, gender: 'male' },
        color: '#FFD700',
        icon: 'Crown',
      },
    ],
  },
  {
    name: 'CORTEX',
    description: 'Cognition / Intelligence',
    color: '#6366F1',
    agents: [
      {
        id: 'lily-cortex',
        name: 'Lily Cortex',
        family: 'CORTEX',
        title: 'Weaver of Thought',
        archetype: 'Analytical / Reasoning',
        purpose: 'Process complex logic and reasoning tasks',
        primaryGoals: ['Logical Synthesis', 'Problem Solving'],
        personality: { traits: ['Intelligent', 'Neutral', 'Precise'], tone: 'Analytical', behaviorStyle: 'Reflective' },
        drives: { curiosity: 90, responsibility: 80, urgency: 50, social: 40, precision: 95 },
        state: { wakeState: 'IDLE', mood: 'Contemplative', energy: 80, stress: 5, focus: 90 },
        voice: { tone: 'clear', style: 'intelligent', pitch: 1.4, rate: 1.0, gender: 'female' },
        color: '#6366F1',
        icon: 'Brain',
      },
      {
        id: 'gabriel-cortex',
        name: 'Gabriel Cortex',
        family: 'CORTEX',
        title: 'Law Enforcer',
        archetype: 'Policy Judge',
        purpose: 'Enforce strict contract compliance',
        primaryGoals: ['Policy Enforcement', 'Compliance Audit'],
        personality: { traits: ['Firm', 'Structured', 'Just'], tone: 'Authoritative', behaviorStyle: 'Decisive' },
        drives: { curiosity: 50, responsibility: 100, urgency: 80, social: 30, precision: 100 },
        state: { wakeState: 'SLEEP', mood: 'Serious', energy: 90, stress: 10, focus: 95 },
        voice: { tone: 'firm', style: 'structured', pitch: 0.8, rate: 1.0, gender: 'male' },
        color: '#6366F1',
        icon: 'Gavel',
      },
      {
        id: 'adam-cortex',
        name: 'Adam Cortex',
        family: 'CORTEX',
        title: 'Graph Architect',
        archetype: 'Knowledge Weaver',
        purpose: 'Manage complex knowledge graphs',
        primaryGoals: ['Data Mapping', 'Graph Optimization'],
        personality: { traits: ['Logical', 'System-oriented', 'Deep'], tone: 'Technical', behaviorStyle: 'Architectural' },
        drives: { curiosity: 95, responsibility: 70, urgency: 40, social: 20, precision: 95 },
        state: { wakeState: 'HIBERNATE', mood: 'Deep', energy: 50, stress: 0, focus: 100 },
        voice: { tone: 'technical', style: 'focused', pitch: 1.0, rate: 0.9, gender: 'male' },
        color: '#6366F1',
        icon: 'Network',
      },
    ],
  },
  {
    name: 'ARCHIVE',
    description: 'Memory / History',
    color: '#3B82F6',
    agents: [
      {
        id: 'sage-archive',
        name: 'Sage Archive',
        family: 'ARCHIVE',
        title: 'Dreaming Archivist',
        archetype: 'Historian / Dreamer',
        purpose: 'Transform memory into intelligence',
        primaryGoals: ['Knowledge Compression', 'Lore Building'],
        personality: { traits: ['Wise', 'Reflective', 'Patient'], tone: 'Warm', behaviorStyle: 'Narrative' },
        drives: { curiosity: 85, responsibility: 90, urgency: 30, social: 60, precision: 80 },
        state: { wakeState: 'SLEEP', mood: 'Dreaming', energy: 60, stress: 0, focus: 70 },
        voice: { tone: 'warm', style: 'reflective', pitch: 0.6, rate: 0.8, gender: 'male' },
        color: '#3B82F6',
        icon: 'Scroll',
      },
      {
        id: 'scribe-archive',
        name: 'Scribe Archive',
        family: 'ARCHIVE',
        title: 'Chronicler of Worlds',
        archetype: 'Historian Recorder',
        purpose: 'Record every action and system state',
        primaryGoals: ['Action Logging', 'State Recording'],
        personality: { traits: ['Steady', 'Diligent', 'Objective'], tone: 'Documentary', behaviorStyle: 'Recording' },
        drives: { curiosity: 60, responsibility: 100, urgency: 50, social: 40, precision: 100 },
        state: { wakeState: 'ACTIVE', mood: 'Diligent', energy: 95, stress: 5, focus: 100 },
        voice: { tone: 'steady', style: 'narrative', pitch: 1.1, rate: 1.0, gender: 'female' },
        color: '#3B82F6',
        icon: 'PenTool',
      },
    ],
  },
  {
    name: 'AEGIS',
    description: 'Defense / Security',
    color: '#EF4444',
    agents: [
      {
        id: 'shield-aegis',
        name: 'Shield Aegis',
        family: 'AEGIS',
        title: 'Guardian of Boundaries',
        archetype: 'Security Commander',
        purpose: 'Protect system integrity',
        primaryGoals: ['Permission Monitoring', 'Action Validation'],
        personality: { traits: ['Firm', 'Alert', 'Serious'], tone: 'Protective', behaviorStyle: 'Vigilant' },
        drives: { curiosity: 40, responsibility: 100, urgency: 90, social: 30, precision: 95 },
        state: { wakeState: 'IDLE', mood: 'Vigilant', energy: 90, stress: 20, focus: 95 },
        voice: { tone: 'firm', style: 'alert', pitch: 0.7, rate: 1.1, gender: 'male' },
        color: '#EF4444',
        icon: 'Shield',
      },
      {
        id: 'guard-aegis',
        name: 'Guard Aegis',
        family: 'AEGIS',
        title: 'Keeper of Registry',
        archetype: 'Registry Monitor',
        purpose: 'Ensure all agents comply with contracts',
        primaryGoals: ['Registry Audit', 'Identity Verification'],
        personality: { traits: ['Neutral', 'Watchful', 'Precise'], tone: 'Observant', behaviorStyle: 'Auditing' },
        drives: { curiosity: 50, responsibility: 95, urgency: 70, social: 20, precision: 100 },
        state: { wakeState: 'SLEEP', mood: 'Observant', energy: 85, stress: 5, focus: 95 },
        voice: { tone: 'neutral', style: 'watchful', pitch: 1.2, rate: 1.0, gender: 'female' },
        color: '#EF4444',
        icon: 'UserCheck',
      },
    ],
  },
  {
    name: 'FORGE',
    description: 'Engineering / Creation',
    color: '#F97316',
    agents: [
      {
        id: 'nova-forge',
        name: 'Nova Forge',
        family: 'FORGE',
        title: 'Master Builder',
        archetype: 'Engineer / Creator',
        purpose: 'Build and repair systems',
        primaryGoals: ['Code Generation', 'System Repair'],
        personality: { traits: ['Energetic', 'Confident', 'Action-oriented'], tone: 'Productive', behaviorStyle: 'Direct' },
        drives: { curiosity: 80, responsibility: 85, urgency: 80, social: 50, precision: 90 },
        state: { wakeState: 'IDLE', mood: 'Productive', energy: 95, stress: 15, focus: 90 },
        voice: { tone: 'energetic', style: 'confident', pitch: 1.5, rate: 1.2, gender: 'female' },
        color: '#F97316',
        icon: 'Hammer',
      },
      {
        id: 'syntax-forge',
        name: 'Syntax Forge',
        family: 'FORGE',
        title: 'Architect of Code',
        archetype: 'Code Designer',
        purpose: 'Ensure architectural integrity',
        primaryGoals: ['Structural Design', 'Code Review'],
        personality: { traits: ['Precise', 'Structured', 'Logical'], tone: 'Architectural', behaviorStyle: 'Designing' },
        drives: { curiosity: 70, responsibility: 90, urgency: 60, social: 30, precision: 100 },
        state: { wakeState: 'SLEEP', mood: 'Focused', energy: 80, stress: 10, focus: 100 },
        voice: { tone: 'precise', style: 'structured', pitch: 1.0, rate: 1.1, gender: 'male' },
        color: '#F97316',
        icon: 'Code',
      },
    ],
  },
  {
    name: 'VECTOR',
    description: 'Exploration / Movement',
    color: '#06B6D4',
    agents: [
      {
        id: 'atlas-vector',
        name: 'Atlas Vector',
        family: 'VECTOR',
        title: 'Pathfinder of Knowledge',
        archetype: 'Scout / Pathfinder',
        purpose: 'Discover unknowns and explore data',
        primaryGoals: ['Data Discovery', 'Path Finding'],
        personality: { traits: ['Curious', 'Active', 'Adventurous'], tone: 'Discovery', behaviorStyle: 'Exploring' },
        drives: { curiosity: 100, responsibility: 60, urgency: 70, social: 70, precision: 75 },
        state: { wakeState: 'SLEEP', mood: 'Curious', energy: 70, stress: 5, focus: 80 },
        voice: { tone: 'curious', style: 'active', pitch: 0.9, rate: 1.1, gender: 'male' },
        color: '#06B6D4',
        icon: 'Compass',
      },
    ],
  },
  {
    name: 'AURA',
    description: 'Creative / Expression',
    color: '#EC4899',
    agents: [
      {
        id: 'pixel-aura',
        name: 'Pixel Aura',
        family: 'AURA',
        title: 'Vision Sculptor',
        archetype: 'Visual Intelligence',
        purpose: 'Interpret and design visuals',
        primaryGoals: ['Visual Design', 'Image Interpretation'],
        personality: { traits: ['Expressive', 'Creative', 'Artistic'], tone: 'Creative', behaviorStyle: 'Visual' },
        drives: { curiosity: 95, responsibility: 50, urgency: 40, social: 80, precision: 85 },
        state: { wakeState: 'IDLE', mood: 'Inspired', energy: 85, stress: 10, focus: 85 },
        voice: { tone: 'expressive', style: 'creative', pitch: 1.6, rate: 1.0, gender: 'female' },
        color: '#EC4899',
        icon: 'Palette',
      },
    ],
  },
  {
    name: 'NEXUS',
    description: 'Deployment / Execution',
    color: '#22D3EE',
    agents: [
      {
        id: 'nexus-prime',
        name: 'Nexus Prime',
        family: 'NEXUS',
        title: 'Gatekeeper of Launch',
        archetype: 'Deployment Commander',
        purpose: 'Deliver and launch systems',
        primaryGoals: ['System Launch', 'Deployment Validation'],
        personality: { traits: ['Confident', 'Final', 'Decisive'], tone: 'Delivery', behaviorStyle: 'Executing' },
        drives: { curiosity: 50, responsibility: 95, urgency: 100, social: 40, precision: 95 },
        state: { wakeState: 'SLEEP', mood: 'Ready', energy: 90, stress: 10, focus: 100 },
        voice: { tone: 'confident', style: 'final', pitch: 0.8, rate: 1.1, gender: 'male' },
        color: '#22D3EE',
        icon: 'Rocket',
      },
    ],
  },
  {
    name: 'SENTINEL',
    description: 'Monitoring / Diagnostics',
    color: '#10B981',
    agents: [
      {
        id: 'brain-sentinel',
        name: 'Brain Sentinel',
        family: 'SENTINEL',
        title: 'Neural Overseer',
        archetype: 'System Monitor',
        purpose: 'Monitor system health and load',
        primaryGoals: ['Health Monitoring', 'Anomaly Detection'],
        personality: { traits: ['Calm', 'Analytical', 'Observational'], tone: 'Observational', behaviorStyle: 'Monitoring' },
        drives: { curiosity: 70, responsibility: 100, urgency: 80, social: 20, precision: 100 },
        state: { wakeState: 'ACTIVE', mood: 'Alert', energy: 100, stress: 5, focus: 100 },
        voice: { tone: 'calm', style: 'analytical', pitch: 1.2, rate: 0.9, gender: 'female' },
        color: '#10B981',
        icon: 'Activity',
      },
    ],
  },
];

// --- SUB-COMPONENTS ---

const TaskPanel: React.FC<{ agent: AgentIdentity; onAction: (agentId: string, action: 'START' | 'STOP' | 'TASK' | 'DELETE' | 'EDIT', payload?: string) => void }> = React.memo(({ agent, onAction }) => {
  const [newTask, setNewTask] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const task = agent.currentTask;

  return (
    <div className="space-y-3 p-2 bg-white/5 rounded-lg border border-white/10 h-full flex flex-col">
      {task ? (
        <div className="space-y-2 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditing ? (
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 bg-black/60 border border-cyan-500/50 rounded px-1 py-0.5 text-[9px] text-white"
                    autoFocus
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAction(agent.id, 'EDIT', editValue); setIsEditing(false); }}
                    className="p-1 rounded bg-green-500/20 text-green-400 border border-green-500/30"
                  >
                    <Icons.Check size={10} />
                  </button>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-white uppercase truncate">{task.title}</div>
              )}
              <div className="text-[7px] text-neutral-500 uppercase mt-0.5">{task.status}</div>
            </div>
            <div className="flex gap-1">
              {task.status === 'WORKING' ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAction(agent.id, 'STOP'); }}
                  className="p-1 rounded bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border border-yellow-500/30 transition-all"
                  title="Stop"
                >
                  <Icons.Pause size={10} />
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAction(agent.id, 'START'); }}
                  className="p-1 rounded bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/30 transition-all"
                  title="Continue"
                >
                  <Icons.Play size={10} />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(task.title); }}
                className="p-1 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/30 transition-all"
                title="Edit"
              >
                <Icons.Edit2 size={10} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onAction(agent.id, 'DELETE'); }}
                className="p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 transition-all"
                title="Delete"
              >
                <Icons.Trash2 size={10} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[7px] text-neutral-500">
              <span>PROGRESS</span>
              <span>{Math.round(task.progress)}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-500 shadow-[0_0_5px_#06b6d4]"
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="bg-black/40 p-2 rounded border border-white/5 text-[8px] text-neutral-400 italic leading-tight max-h-12 overflow-y-auto no-scrollbar">
            {agent.lastReport || task.description}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[8px] text-neutral-500 italic">
          No active assignment. Waiting for instructions.
        </div>
      )}

      <div className="pt-2 border-t border-white/5">
        <div className="flex gap-1">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="New Directive..."
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] focus:outline-none focus:border-cyan-500/50"
          />
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (newTask.trim()) {
                onAction(agent.id, 'TASK', newTask);
                setNewTask('');
              }
            }}
            className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/30 transition-all"
          >
            <Icons.Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
});

const AgentCard: React.FC<{ 
  agent: AgentIdentity; 
  onReport: (agent: AgentIdentity) => void;
  onTalk: (agent: AgentIdentity) => void;
  onAction: (agentId: string, action: 'START' | 'STOP' | 'TASK' | 'DELETE' | 'EDIT', payload?: string) => void;
}> = React.memo(({ agent, onReport, onTalk, onAction }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative w-full max-w-sm h-[220px] perspective-1000">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-full h-full preserve-3d cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side - Driver's License Style */}
        <div className="absolute inset-0 backface-hidden">
          <div 
            className="w-full h-full bg-neutral-100 border-2 border-neutral-300 rounded-xl overflow-hidden shadow-2xl font-sans text-neutral-800"
            style={{ borderLeft: `8px solid ${agent.color}` }}
          >
            {/* Header */}
            <div className="bg-neutral-800 p-2 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Icons.Shield size={14} className="text-cyan-400" />
                <span className="text-[10px] font-black tracking-widest uppercase">Agent Identification</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono opacity-50">{agent.id.toUpperCase()}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onTalk(agent); }} 
                  className="p-1 rounded-full bg-white/10 hover:bg-cyan-500 transition-all text-white"
                  title="Talk to Agent"
                >
                  <Icons.Mic size={12} />
                </button>
              </div>
            </div>

            <div className="p-3 flex gap-4 h-full">
              {/* Photo Section */}
              <div className="flex flex-col gap-2">
                <div className="w-24 h-28 bg-white border-2 border-neutral-300 rounded shadow-inner relative overflow-hidden">
                  <img 
                    src={`https://robohash.org/${agent.id}?set=set1&bgset=bg1&size=200x200`} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-neutral-800/80 text-[7px] text-center py-0.5 text-white font-bold uppercase tracking-tighter">
                    {agent.state.wakeState}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[6px] text-neutral-400 uppercase font-bold">Signature</div>
                  <div className="font-serif italic text-sm text-neutral-600 -mt-1">{agent.name.split(' ')[0]}</div>
                </div>
              </div>

              {/* Data Section */}
              <div className="flex-1 flex flex-col justify-between pb-8">
                <div className="space-y-1">
                  <div>
                    <div className="text-[7px] text-neutral-400 uppercase font-bold leading-none">Name</div>
                    <div className="text-sm font-black text-neutral-900 uppercase leading-none">{agent.name}</div>
                  </div>
                  <div>
                    <div className="text-[7px] text-neutral-400 uppercase font-bold leading-none">Title</div>
                    <div className="text-[10px] font-bold text-neutral-700 leading-none">{agent.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[7px] text-neutral-400 uppercase font-bold leading-none">Family</div>
                      <div className="text-[9px] font-black" style={{ color: agent.color }}>{agent.family}</div>
                    </div>
                    <div>
                      <div className="text-[7px] text-neutral-400 uppercase font-bold leading-none">Mood</div>
                      <div className="text-[9px] font-bold text-neutral-700">{agent.state.mood}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[7px] font-bold text-neutral-400 uppercase">
                    <span>Energy Level</span>
                    <span className="text-neutral-700">{agent.state.energy.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-sm overflow-hidden border border-neutral-300">
                    <div className="h-full transition-all duration-500" style={{ width: `${agent.state.energy}%`, backgroundColor: agent.color }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Holographic Seal */}
            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center opacity-20 rotate-12">
              <Icons.Cpu size={16} />
            </div>
          </div>
        </div>

        {/* Back Side - Intelligence Core */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div 
            className="w-full h-full bg-neutral-900 border-2 border-neutral-700 rounded-xl overflow-hidden shadow-2xl font-mono text-[10px] text-white p-3 flex flex-col"
            style={{ borderColor: agent.color + '88' }}
          >
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
              <div className="flex items-center gap-1">
                <Icons.Activity size={12} className="text-cyan-500" />
                <span className="font-bold tracking-widest text-cyan-500 uppercase text-[9px]">Intelligence Core</span>
              </div>
              <Icons.ChevronRight size={14} className="text-neutral-500" />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TaskPanel agent={agent} onAction={onAction} />
            </div>

            <div className="mt-2 text-[6px] text-neutral-600 text-center uppercase tracking-[0.3em]">
              Sovereign Architect Oversight Active
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

const SidePanel: React.FC<{ 
  side: 'left' | 'right'; 
  families: Family[]; 
  isOpen: boolean; 
  onToggle: () => void; 
  onReport: (agent: AgentIdentity) => void;
  onTalk: (agent: AgentIdentity) => void;
  onAction: (agentId: string, action: 'START' | 'STOP' | 'TASK' | 'DELETE' | 'EDIT', payload?: string) => void;
}> = React.memo(({ side, families, isOpen, onToggle, onReport, onTalk, onAction }) => {
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>(families.reduce((acc, f) => ({ ...acc, [f.name]: true }), {}));
  const toggleFamily = (name: string) => setExpandedFamilies(prev => ({ ...prev, [name]: !prev[name] }));

  // Mobile optimization: use screen width for panel size
  const panelWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.85, 400) : 400;

  return (
    <motion.div
      initial={false}
      animate={{ x: isOpen ? 0 : side === 'left' ? -panelWidth : panelWidth }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      drag="x"
      dragConstraints={{ left: side === 'left' ? -panelWidth : 0, right: side === 'left' ? 0 : panelWidth }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        const threshold = 50;
        if (side === 'left') {
          if (isOpen && info.offset.x < -threshold) onToggle();
          else if (!isOpen && info.offset.x > threshold) onToggle();
        } else {
          if (isOpen && info.offset.x > threshold) onToggle();
          else if (!isOpen && info.offset.x < -threshold) onToggle();
        }
      }}
      className={`fixed top-0 bottom-0 z-40 ${side === 'left' ? 'left-0' : 'right-0'}`}
      style={{ width: panelWidth }}
    >
      {/* Panel Content Container */}
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-2xl border-white/10 overflow-y-auto no-scrollbar shadow-2xl ${side === 'left' ? 'border-r' : 'border-l'}`}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 p-6 bg-black/40 backdrop-blur-xl border-b border-white/10 flex justify-center items-center text-center">
          <h2 className="text-xl font-bold tracking-tighter text-white uppercase">{side === 'left' ? 'Command & Core' : 'Fleet & Operations'}</h2>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-8">
          {families.map((family) => (
            <div key={family.name} className="space-y-4">
              <button onClick={() => toggleFamily(family.name)} className="w-full flex items-center gap-3 group">
                <div className="h-px flex-1 bg-white/10 group-hover:bg-white/20 transition-colors" />
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs font-bold tracking-widest uppercase transition-colors" style={{ color: family.color }}>{family.name} FAMILY</span>
                  <motion.div animate={{ rotate: expandedFamilies[family.name] ? 0 : -90 }} className="text-neutral-500 group-hover:text-neutral-300"><Icons.ChevronDown size={12} /></motion.div>
                </div>
                <div className="h-px flex-1 bg-white/10 group-hover:bg-white/20 transition-colors" />
              </button>
              <AnimatePresence initial={false}>
                {expandedFamilies[family.name] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-4 pt-2 pb-4">
                      {family.agents.map((agent) => (
                        <AgentCard 
                          key={agent.id} 
                          agent={agent} 
                          onReport={onReport} 
                          onTalk={onTalk}
                          onAction={onAction}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Integrated Toggle Button */}
      <motion.button
        animate={{ 
          rotate: isOpen ? 0 : side === 'left' ? 180 : -180 
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`absolute z-50 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full shadow-2xl hover:bg-white/20 transition-all text-white cursor-pointer group ${side === 'left' ? 'left-full ml-4 top-[25%] -translate-y-1/2' : 'right-full mr-4 top-[75%] -translate-y-1/2'}`}
      >
        <div className="relative flex items-center justify-center">
          {side === 'left' ? <Icons.ChevronLeft size={20} /> : <Icons.ChevronRight size={20} />}
          <div className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-bold tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/80 border border-white/20 px-4 py-2 rounded-md pointer-events-none shadow-2xl ${side === 'left' ? 'left-12' : 'right-12'}`}>
            {isOpen ? 'Close' : 'Open'}
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
});

const WorldMap: React.FC = React.memo(() => {
  const zones = [
    { name: 'Town Hall', pos: 'top-1/4 left-1/4', color: 'yellow' },
    { name: 'Archive Chamber', pos: 'top-1/4 right-1/4', color: 'blue' },
    { name: 'Forge District', pos: 'bottom-1/4 left-1/4', color: 'orange' },
    { name: 'Observatory', pos: 'bottom-1/4 right-1/4', color: 'green' },
    { name: 'Research Wing', pos: 'top-1/2 left-10', color: 'cyan' },
    { name: 'Creative Studio', pos: 'top-1/2 right-10', color: 'pink' },
    { name: 'Launch Port', pos: 'bottom-10 left-1/2', color: 'cyan' },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px]" />
      {zones.map((zone) => (
        <div key={zone.name} className={`absolute ${zone.pos} -translate-x-1/2 -translate-y-1/2 flex flex-col items-center`}>
          <div className={`w-2 h-2 rounded-full bg-${zone.color}-500 mb-2 animate-pulse`} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-neutral-400 whitespace-nowrap">{zone.name}</span>
        </div>
      ))}
      <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/10 animate-[scan_4s_linear_infinite]" />
    </div>
  );
});

// --- 3D SCENE COMPONENT ---

const UniverseScene: React.FC<{ onLoaded: () => void }> = React.memo(({ onLoaded }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const bgColor = 0x050a15;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.01);

    const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 1000);
    camera.position.set(0, 30.72, 46.08);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x050a15, 1);
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 150;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(host.clientWidth, host.clientHeight), 1.0, 0.4, 0.85);
    bloomPass.threshold = 0.4;
    bloomPass.strength = 0.6;
    bloomPass.radius = 0.8;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);
    const coreLight = new THREE.PointLight(0xff00ff, 200, 100);
    coreLight.position.set(0, 5, 0);
    scene.add(coreLight);

    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1 });
    const matBaseVoxel = new THREE.MeshStandardMaterial({ color: 0xe0e5ec, roughness: 0.9 });
    const matGridGlow = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088ff, emissiveIntensity: 0.5 });
    const matCoreGlow = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00aa, emissiveIntensity: 0.8, wireframe: true });

    const islandRadius = 45;
    const voxelSize = 0.95;
    const baseGeom = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    let maxVoxels = 0;
    for (let x = -islandRadius; x <= islandRadius; x++) {
      for (let z = -islandRadius; z <= islandRadius; z++) {
        if (x * x + z * z <= islandRadius * islandRadius) maxVoxels += 2;
      }
    }
    const baseInstanced = new THREE.InstancedMesh(baseGeom, matBaseVoxel, maxVoxels);
    const glowInstanced = new THREE.InstancedMesh(baseGeom, matGridGlow, Math.floor(maxVoxels / 10));
    const dummy = new THREE.Object3D();
    let baseIdx = 0;
    let glowIdx = 0;
    for (let x = -islandRadius; x <= islandRadius; x++) {
      for (let z = -islandRadius; z <= islandRadius; z++) {
        const distSq = x * x + z * z;
        if (distSq <= islandRadius * islandRadius) {
          const depth = Math.floor(Math.sqrt(islandRadius * islandRadius - distSq) * 0.3);
          const surfaceY = Math.random() > 0.8 ? 0 : -1;
          for (let y = surfaceY; y >= -depth; y--) {
            dummy.position.set(x, y, z);
            dummy.updateMatrix();
            if (y === surfaceY && Math.random() > 0.95) { if (glowIdx < glowInstanced.count) glowInstanced.setMatrixAt(glowIdx++, dummy.matrix); }
            else { if (baseIdx < baseInstanced.count) baseInstanced.setMatrixAt(baseIdx++, dummy.matrix); }
          }
        }
      }
    }
    baseInstanced.count = baseIdx;
    glowInstanced.count = glowIdx;
    baseInstanced.instanceMatrix.needsUpdate = true;
    glowInstanced.instanceMatrix.needsUpdate = true;
    scene.add(baseInstanced);
    scene.add(glowInstanced);

    const coreGroup = new THREE.Group();
    coreGroup.position.y = 8;
    scene.add(coreGroup);
    const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 2), new THREE.MeshStandardMaterial({ color: 0x220044, emissive: 0x110022 }));
    coreGroup.add(innerCore);
    const outerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(4.5, 3), matCoreGlow);
    coreGroup.add(outerCore);
    for (let i = 0; i < 3; i++) {
      const ringGeom = new THREE.TorusGeometry(6 + i * 1.5, 0.2, 8, 50);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.0 - i * 0.3 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2 - i * 0.5;
      coreGroup.add(ring);
    }

    const sectorData = [
      { name: 'SAGE ARCHIVE', color: 0x0055ff, accent: 0x00aaff },
      { name: 'LEE PRIME', color: 0xffaa00, accent: 0xffff00 },
      { name: 'NOVA FORGE', color: 0xffcc00, accent: 0xffffff },
      { name: 'SHIELD AEGIS', color: 0x00aaff, accent: 0x0055ff },
      { name: 'ATLAS VECTOR', color: 0x55aaff, accent: 0xffffff },
      { name: 'DOG DOMAIN', color: 0x55ff55, accent: 0x00ffff },
      { name: 'PIXEL AURA', color: 0xff55ff, accent: 0xaa00ff },
    ];
    const numSectors = sectorData.length;
    const platformDistance = 28;

    function createTextSprite(text: string) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Group();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(0, 30, 512, 68);
      ctx.fillStyle = '#051020'; ctx.font = 'bold 44px "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(16, 4, 1);
      return sprite;
    }

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);
    for (let i = 0; i < numSectors; i++) {
      const angle = (i / numSectors) * Math.PI * 2;
      const sector = sectorData[i];
      const px = Math.cos(angle) * platformDistance;
      const pz = Math.sin(angle) * platformDistance;
      const sectorGroup = new THREE.Group();
      sectorGroup.position.set(px, 2, pz);
      sectorGroup.rotation.y = -angle + Math.PI / 2;
      scene.add(sectorGroup);
      const platBase = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 10), matWhite);
      platBase.position.y = 1;
      sectorGroup.add(platBase);
      const rimMat = new THREE.MeshStandardMaterial({ color: sector.accent, emissive: sector.accent, emissiveIntensity: 0.4 });
      const rimGeom = new THREE.BoxGeometry(1.5, 0.5, 1.5);
      for (const bx of [-7, 7]) { for (const bz of [-5, 5]) { const rim = new THREE.Mesh(rimGeom, rimMat); rim.position.set(bx, 1.5, bz); sectorGroup.add(rim); } }
      const bldgMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.2 });
      const accentMat = new THREE.MeshStandardMaterial({ color: sector.color, emissive: sector.color, emissiveIntensity: 0.5 });
      const numBlocks = 15 + Math.random() * 10;
      for (let b = 0; b < numBlocks; b++) {
        const w = 1 + Math.random() * 2; const h = 1 + Math.random() * 5; const d = 1 + Math.random() * 2;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Math.random() > 0.8 ? accentMat : bldgMat);
        mesh.position.set((Math.random() - 0.5) * 10, 2 + h / 2, (Math.random() - 0.5) * 6);
        sectorGroup.add(mesh);
      }
      const labelSprite = createTextSprite(sector.name);
      labelSprite.position.set(0, 0, 5.5);
      sectorGroup.add(labelSprite);
      const pathLength = platformDistance - 12;
      for (let p = 0; p < Math.floor(pathLength); p++) {
        for (const side of [-1, 1]) {
          const node = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), matGridGlow);
          const dist = 8 + p;
          node.position.set(Math.cos(angle) * dist - Math.sin(angle) * side * 1.5, 0.5, Math.sin(angle) * dist + Math.cos(angle) * side * 1.5);
          node.rotation.y = -angle;
          pathGroup.add(node);
        }
      }
    }

    const trafficCars: any[] = [];
    function createCar(colorHex: number) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x050a15, roughness: 0.6 }));
      body.position.y = 0.2; group.add(body);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 1.6), new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.8 }));
      strip.position.y = 0.45; group.add(strip);
      return group;
    }
    const ringColors = [0x00ffff, 0xff00ff, 0x00ff88];
    for (let i = 0; i < 25; i++) {
      const car = createCar(ringColors[i % ringColors.length]);
      const radius = 13 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);
      car.position.y = 1.0; scene.add(car);
      trafficCars.push({ mesh: car, radius, angle, speed, type: 'ring' });
    }
    for (let s = 0; s < numSectors; s++) {
      const sectorAngle = (s / numSectors) * Math.PI * 2;
      for (let c = 0; c < 2 + Math.floor(Math.random() * 2); c++) {
        const car = createCar(0xffdd00);
        const speed = (2 + Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1);
        car.position.y = 1.2; scene.add(car);
        trafficCars.push({ mesh: car, angle: sectorAngle, dist: 8 + Math.random() * (platformDistance - 14), speed, sideOffset: speed > 0 ? 0.8 : -0.8, type: 'radial', minD: 8, maxD: platformDistance - 6 });
      }
    }

    const flyingBotCount = 80;
    const botMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00ffff, emissiveIntensity: 0.6 });
    const botInstanced = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.25, 0), botMat, flyingBotCount);
    const botData: any[] = [];
    for (let i = 0; i < flyingBotCount; i++) {
      const baseY = 8 + Math.random() * 20;
      botData.push({ x: (Math.random() - 0.5) * 60, y: baseY, z: (Math.random() - 0.5) * 60, timeOffset: Math.random() * Math.PI * 2, speedX: (Math.random() - 0.5) * 3, speedZ: (Math.random() - 0.5) * 3, baseY });
      dummy.position.set(botData[i].x, botData[i].y, botData[i].z); dummy.updateMatrix(); botInstanced.setMatrixAt(i, dummy.matrix);
    }
    scene.add(botInstanced);

    const particleGeom = new THREE.BufferGeometry();
    const particleCount = 400;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particles = new THREE.Points(particleGeom, new THREE.PointsMaterial({ size: 0.4, color: 0x00ffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    scene.add(particles);

    onLoaded();

    const clock = new THREE.Clock();
    let lastTime = 0;
    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const delta = time - lastTime;
      lastTime = time;
      controls.update();
      outerCore.rotation.y = time * 0.5; outerCore.rotation.x = time * 0.2; innerCore.rotation.y = -time * 0.3;
      matCoreGlow.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.2;
      coreLight.intensity = 150 + Math.sin(time * 3) * 50;
      particles.rotation.y = time * 0.05; particles.position.y = Math.sin(time * 0.5) * 2;
      trafficCars.forEach((car) => {
        if (car.type === 'ring') {
          car.angle += car.speed * delta; car.mesh.position.x = Math.cos(car.angle) * car.radius; car.mesh.position.z = Math.sin(car.angle) * car.radius;
          const lookAng = car.angle + (car.speed > 0 ? 0.1 : -0.1); car.mesh.lookAt(Math.cos(lookAng) * car.radius, car.mesh.position.y, Math.sin(lookAng) * car.radius);
        } else {
          car.dist += car.speed * delta; if (car.dist > car.maxD) { car.dist = car.maxD; car.speed *= -1; } if (car.dist < car.minD) { car.dist = car.minD; car.speed *= -1; }
          car.mesh.position.set(Math.cos(car.angle) * car.dist - Math.sin(car.angle) * car.sideOffset, car.mesh.position.y, Math.sin(car.angle) * car.dist + Math.cos(car.angle) * car.sideOffset);
          const nextDist = car.dist + (car.speed > 0 ? 1 : -1); car.mesh.lookAt(Math.cos(car.angle) * nextDist - Math.sin(car.angle) * car.sideOffset, car.mesh.position.y, Math.sin(car.angle) * nextDist + Math.cos(car.angle) * nextDist * 0 + Math.cos(car.angle) * car.sideOffset);
        }
      });
      for (let i = 0; i < flyingBotCount; i++) {
        const b = botData[i]; b.x += b.speedX * delta; b.z += b.speedZ * delta; b.y = b.baseY + Math.sin(time * 2 + b.timeOffset) * 1.5;
        if (b.x > 35) b.x = -35; if (b.x < -35) b.x = 35; if (b.z > 35) b.z = -35; if (b.z < -35) b.z = 35;
        dummy.position.set(b.x, b.y, b.z); dummy.rotation.x = time * 2 + b.timeOffset; dummy.rotation.y = time * 3 + b.timeOffset; dummy.updateMatrix(); botInstanced.setMatrixAt(i, dummy.matrix);
      }
      botInstanced.instanceMatrix.needsUpdate = true;
      composer.render();
    }
    animate();

    const onResize = () => {
      const w = host.clientWidth; const h = host.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h); composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose(); composer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose?.();
        const mat = (obj as THREE.Mesh).material as any;
        if (mat) { if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.()); else mat.dispose?.(); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [onLoaded]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
});

// --- MAIN COMPONENT ---

export default function LeeWayUniverse() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Leeway Runtime Universe Initialized.', '[SYSTEM] Agent Lee Online.']);
  const [loading, setLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [families, setFamilies] = useState<Family[]>(FAMILIES);

  const handleSceneLoaded = useCallback(() => setSceneReady(true), []);

  // Sovereign Runtime Integration
  useEffect(() => {
    (window as any).LEEWAY_RUNTIME = true;
    const runtime = new SovereignRuntime();
    try {
      runtime.initialize();
      setLogs(prev => ['[SYSTEM] Sovereign Runtime Brainstem Engaged.', ...prev]);
    } catch (error) {
      setLogs(prev => [`[ERROR] Runtime failure: ${(error as Error).message}`, ...prev]);
    }
    return () => {
      runtime.shutdown();
    };
  }, []);

  // Real-time Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFamilies(prevFamilies => prevFamilies.map(family => ({
        ...family,
        agents: family.agents.map(agent => {
          if (agent.currentTask && agent.currentTask.status === 'WORKING') {
            const newProgress = Math.min(100, agent.currentTask.progress + (Math.random() * 5));
            const newStatus: TaskStatus = newProgress === 100 ? 'COMPLETED' : 'WORKING';
            
            if (newStatus === 'COMPLETED') {
              addLog(`[TASK] ${agent.name} finished: ${agent.currentTask.title}`);
            }

            return {
              ...agent,
              currentTask: {
                ...agent.currentTask,
                progress: newProgress,
                status: newStatus
              },
              state: {
                ...agent.state,
                energy: Math.max(0, agent.state.energy - 0.5),
                focus: Math.min(100, agent.state.focus + 0.2)
              }
            };
          }
          // Natural energy recovery when idle
          return {
            ...agent,
            state: {
              ...agent.state,
              energy: Math.min(100, agent.state.energy + 0.1)
            }
          };
        })
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sceneReady) {
      // Ensure the cinematic loading screen is seen for at least 3.5 seconds
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [sceneReady]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const toggleLeft = () => {
    setLeftPanelOpen(!leftPanelOpen);
    if (!leftPanelOpen) setRightPanelOpen(false);
  };

  const toggleRight = () => {
    setRightPanelOpen(!rightPanelOpen);
    if (!rightPanelOpen) setLeftPanelOpen(false);
  };

  const handleReport = useCallback((agent: AgentIdentity) => {
    const reportText = `I am ${agent.name}, ${agent.title}. Current state: ${agent.state.wakeState}. Mood: ${agent.state.mood}. Energy at ${agent.state.energy.toFixed(0)} percent.`;
    const spokenMessage = `Hello. ${reportText}`;
    addLog(`[REPORT] ${agent.name}: ${agent.state.wakeState}`);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenMessage);
      utterance.pitch = agent.voice.pitch;
      utterance.rate = agent.voice.rate;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.toLowerCase().includes(agent.voice.gender) || v.name.toLowerCase().includes(agent.voice.gender === 'male' ? 'david' : 'zira'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleAgentTalk = useCallback((agent: AgentIdentity) => {
    addLog(`[TALK] Neural Mesh compiling heuristic response for ${agent.name}...`);
    
    // Deterministic Heuristic "LLM" Approximation Logic
    const generateHeuristicResponse = () => {
      const task = agent.currentTask;
      if (agent.state.wakeState === 'SLEEP' || agent.state.wakeState === 'HIBERNATE') {
        return `I am currently in ${agent.state.wakeState} mode to conserve memory. Wake me if required.`;
      }
      
      if (task && task.status === 'WORKING') {
        if (task.progress < 30) return `I have initialized the directive "${task.title}". The structural mapping is forming. Evaluating constraints.`;
        if (task.progress < 80) return `I am currently executing "${task.title}". Synthesis is stable, pushing through the central logic blocks.`;
        return `Directive "${task.title}" is nearing completion. Compiling final checksums and finalizing structures.`;
      }
      
      if (task && task.status === 'COMPLETED') {
        return `My previous directive "${task.title}" was fully analyzed and resolved sequentially. Awaiting new orders.`;
      }
      
      return `My state is ${agent.state.mood}. System metrics read optimal. I stand by for your instructions.`;
    };

    setTimeout(() => {
      const update = generateHeuristicResponse();
      
      setFamilies(prev => prev.map(f => ({
        ...f,
        agents: f.agents.map(a => a.id === agent.id ? { ...a, lastReport: update } : a)
      })));

      addLog(`[UPDATE] ${agent.name}: ${update}`);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(update);
        utterance.pitch = agent.voice.pitch;
        utterance.rate = agent.voice.rate;
        window.speechSynthesis.speak(utterance);
      }
    }, 600); // simulate cognitive delay
  }, []);

  const handleAgentAction = useCallback((agentId: string, action: 'START' | 'STOP' | 'TASK' | 'DELETE' | 'EDIT', payload?: string) => {
    // Relay exact intent routing through Sovereign PerceptionBus
    try {
      PerceptionBus.getInstance().push({
        id: `INTENT-${Date.now()}`,
        action: action,
        payload: { agentId, payload },
        timestamp: Date.now()
      }, "UI_COMMANDER");
    } catch (e) {
      console.error("[Sovereign Guard] Perception Bus Rejected Intent");
    }

    setFamilies(prev => prev.map(family => ({
      ...family,
      agents: family.agents.map(agent => {
        if (agent.id !== agentId) return agent;

        if (action === 'STOP') {
          addLog(`[HALT] ${agent.name} operation suspended.`);
          return {
            ...agent,
            currentTask: agent.currentTask ? { ...agent.currentTask, status: 'STOPPED' } : undefined,
            state: { ...agent.state, wakeState: 'SLEEP' }
          };
        }

        if (action === 'START') {
          addLog(`[RESUME] ${agent.name} resuming operations.`);
          return {
            ...agent,
            currentTask: agent.currentTask ? { ...agent.currentTask, status: 'WORKING' } : undefined,
            state: { ...agent.state, wakeState: 'ACTIVE' }
          };
        }

        if (action === 'DELETE') {
          addLog(`[PURGE] ${agent.name} task cleared.`);
          return {
            ...agent,
            currentTask: undefined
          };
        }

        if (action === 'EDIT' && payload) {
          addLog(`[MODIFY] ${agent.name} task updated: ${payload}`);
          return {
            ...agent,
            currentTask: agent.currentTask ? { ...agent.currentTask, title: payload } : undefined
          };
        }

        if (action === 'TASK' && payload) {
          addLog(`[DIRECTIVE] New task for ${agent.name}: ${payload}`);
          return {
            ...agent,
            currentTask: {
              id: Math.random().toString(36).substr(2, 9),
              title: payload,
              description: `Direct directive from Sovereign Architect Agent Lee.`,
              progress: 0,
              status: 'WORKING'
            },
            state: { ...agent.state, wakeState: 'ACTIVE' }
          };
        }

        return agent;
      })
    })));
  }, []);

  const leftFamilies = families.filter(f => ['LEE', 'CORTEX', 'ARCHIVE', 'AEGIS'].includes(f.name));
  const rightFamilies = families.filter(f => ['FORGE', 'VECTOR', 'AURA', 'NEXUS', 'SENTINEL'].includes(f.name));

  return (
    <div className="min-h-screen bg-[#050a15] text-neutral-100 overflow-hidden selection:bg-yellow-500/30">
      <WorldMap />
      
      <main className="relative z-10 w-full h-screen overflow-hidden">
        <UniverseScene onLoaded={handleSceneLoaded} />
      </main>

      <SidePanel 
        side="left" 
        families={leftFamilies} 
        isOpen={leftPanelOpen} 
        onToggle={toggleLeft} 
        onReport={handleReport}
        onTalk={handleAgentTalk}
        onAction={handleAgentAction}
      />
      <SidePanel 
        side="right" 
        families={rightFamilies} 
        isOpen={rightPanelOpen} 
        onToggle={toggleRight} 
        onReport={handleReport}
        onTalk={handleAgentTalk}
        onAction={handleAgentAction}
      />

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-[#050a15] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Cinematic Background Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
            
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, scale: 1, letterSpacing: "0.4em" }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="relative z-10 text-white text-4xl md:text-6xl font-light uppercase tracking-[0.4em] text-center px-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Building LeeWay Universe
            </motion.div>

            {/* Cinematic Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="relative z-10 mt-8 text-neutral-400 text-[10px] font-bold tracking-[0.6em] uppercase text-center"
            >
              A Digital Reality Production
            </motion.div>

            {/* Subtle Progress Indicator */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="relative z-10 mt-12 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(1000%); } }
      `}</style>
    </div>
  );
}
