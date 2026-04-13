/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.EVENTS
TAG: CORE.EVENT_BUS
5WH:
  WHAT = Centralized event bus for inter-agent communication
  WHY = Enables the "Hive Mind" effect where agents can listen and react to system state
  WHO = LeeWay Innovations
*/

import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

// Log all events if in debug mode
eventBus.on('agent:active', (data) => {
  console.log(`📡 [HIVE_CHATTER] Agent [${data.agent}] is now: ${data.task}`);
});

eventBus.on('agent:done', (data) => {
  console.log(`✅ [HIVE_CHATTER] Agent [${data.agent}] completed: ${data.result}`);
});
