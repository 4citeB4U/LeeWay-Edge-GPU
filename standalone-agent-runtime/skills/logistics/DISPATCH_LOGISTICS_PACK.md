# SKILL: logistics.dispatch.triangulate_loads

## PURPOSE
To maximize driver profit by finding a sequence of loads that minimizes deadhead and optimizes time-on-road.

## TRIGGER
"Triangulate a route for truck [ID] starting at [Location]"

## WORKFLOW
1. **Source Active Load**: Find a primary load (Load A) from the Load Board (MCP: dat_board).
2. **Predict Arrival**: Calculate ETA at drop-off point for Load A.
3. **Scan Radius**: Search for Load B within a 50-mile radius of Load A's destination.
4. **Deadhead Analysis**: Calculate mileage between Load A destination and Load B origin.
5. **Profit Calculation**: (Total Gross - (Total Miles * CostPerMile)) / Total Hours.
6. **Proposal**: Output a 3-load "Chain" with guaranteed profit margins.

## VALIDATION
- Deadhead < 15% of total trip miles.
- Hours of Service (HOS) compliant.

---

# SKILL: logistics.broker.negotiate_load

## PURPOSE
To conduct a performance-based negotiation with a broker for a specific load.

## TRIGGER
"Negotiate load [LoadID] for driver [DriverName]"

## WORKFLOW
1. **Market Rate Benchmark**: Query market average for the current lane.
2. **Driver History Check**: Extract driver's reliability score and current equipment status.
3. **Outbound Call (Google Voice)**: Initiate call to the broker listed on the load.
4. **Negotiation Script**:
   - Confirm load availability.
   - Present driver credentials.
   - Propose "Market Rate + 10%" based on specialized equipment/reliability.
5. **Capture Commitment**: Summarize agreed-upon rate in conversation and log it.

## VALIDATION
- Rate confirmed in transcript.
- Broker ID logged.
