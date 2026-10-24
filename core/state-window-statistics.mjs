/*
REGION: LEEWAY.EDGE_GPU.STATE_PREPARATION
TAG: LEEWAY.EDGE_GPU.ROLLING_STATISTICS.G2
WHAT: Comparison-only incremental statistics for an existing canonical 16x6 history.
WHY: Remove an outgoing row's contribution and add the incoming row without rescanning all pairs.
WHO: Creator-authorized Agent Lee. WHERE: Edge GPU candidate input-preparation capability.
WHEN: Explicit validated state observations; no natural-language or spatial mapping is supplied here.
HOW: Integer frequency/column/presence/co-occurrence counts; canonical ranking remains external.
ROLES: ASSESS VERIFY. LICENSE: MIT
*/
const WIDTH=6,WINDOW=16,STATES=70;
function checkedRow(row){
 if(!Array.isArray(row)||row.length!==WIDTH||!row.every(v=>Number.isInteger(v)&&v>=0&&v<STATES))throw new TypeError('STATE_ROW_MUST_BE_SIX_INTEGERS_0_TO_69');
 return row.slice();
}
export class StateWindowStatistics{
 #rows=[];#tick=0;#frequency=new Uint16Array(STATES);#columns=new Uint16Array(STATES*WIDTH);
 #pairs=new Uint8Array(STATES*STATES);#neighbors=new Uint8Array(STATES);
 #occurrences=Array.from({length:STATES},()=>[]);#lastPairAdjustments=0;
 constructor(matrix){
  if(!Array.isArray(matrix)||matrix.length!==WINDOW)throw new TypeError('STATE_HISTORY_MUST_HAVE_SIXTEEN_ROWS');
  const rows=matrix.map(checkedRow);
  for(const row of rows){this.#tick++;this.#rows.push(row);this.#apply(row,1,this.#tick);}
  this.#lastPairAdjustments=0;
 }
 #apply(row,direction,tick){
  for(let col=0;col<WIDTH;col++){const x=row[col];this.#frequency[x]+=direction;this.#columns[x*WIDTH+col]+=direction;}
  const unique=[...new Set(row)];
  for(const x of unique){
   if(direction===1)this.#occurrences[x].push(tick);
   else if(this.#occurrences[x].shift()!==tick)throw Error('STATE_OCCURRENCE_INVARIANT_FAILED');
  }
  for(let i=0;i<unique.length;i++)for(let j=i+1;j<unique.length;j++){
   const x=unique[i],y=unique[j],index=x*STATES+y;
   const old=this.#pairs[index],next=old+direction;
   if(next<0||next>WINDOW)throw Error('STATE_PAIR_INVARIANT_FAILED');
   this.#pairs[index]=next;this.#pairs[y*STATES+x]=next;
   const delta=Number(next>=2)-Number(old>=2);
   this.#neighbors[x]+=delta;this.#neighbors[y]+=delta;this.#lastPairAdjustments++;
  }
 }
 append(row){
  const incoming=checkedRow(row);
  if(this.#tick>=Number.MAX_SAFE_INTEGER-1)throw Error('STATE_EPOCH_EXHAUSTED');
  this.#lastPairAdjustments=0;
  this.#apply(this.#rows.shift(),-1,this.#tick-WINDOW+1);
  this.#rows.push(incoming);this.#tick++;this.#apply(incoming,1,this.#tick);
  return this.describe();
 }
 snapshot(){return this.#rows.map(r=>r.slice());}
 statistics(){
  const origin=this.#tick-WINDOW;
  return Array.from({length:STATES},(_,x)=>({state:x,frequency:this.#frequency[x],
   columns:Array.from(this.#columns.subarray(x*WIDTH,(x+1)*WIDTH)),
   occurrenceRows:this.#occurrences[x].map(t=>t-origin),cooccurringStates:this.#neighbors[x]}));
 }
 describe(){return {kind:'CANDIDATE_HISTORY_STATISTICS_NOT_FORMULA_EVALUATOR',window:WINDOW,width:WIDTH,states:STATES,
  epoch:this.#tick,lastUnorderedPairAdjustments:this.#lastPairAdjustments,
  canonicalRanking:'EXTERNAL_UNCHANGED',formulaExecution:'NOT_EXECUTED_BY_THIS_HELPER'};}
}
