# @red-cup-engineering/derive-set-of-due-events-service

Derives which of a set of iCalendar (RFC 5545) VEVENT-shaped scheduled events are due as of `now`, composing expand-recurrence-rule-service to find each event's most recent recurrence instance at or before `now`.

## Operation

~~~js
export function deriveSetOfDueEvents(request)
~~~

### Parameters

- request ({events: Array<{id: string, dtstart: string, rrule?: string, exdate?: string[], rdate?: string[]}>, now: string, lastDone?: Record<string, string>}): A record naming the set of scheduled events (each an RFC 5545 basic-UTC VEVENT: dtstart, an optional rrule text, optional exdate/rdate arrays), the current instant `now` (a Date-parseable ISO 8601 instant), and an optional map from event id to the ISO 8601 instant it was last completed.

### Returns

{due: Array<{id: string, occurrence: string, reason: "never-done"|"occurrence-after-last-done"}>}: Every event with at least one occurrence at or before `now` not already covered by its lastDone entry, each named with its most recent such occurrence and the reason it is due.

### Refusals

- TypeError: When request.events is not an array, request.now is not a string, or an event lacks a string id or dtstart.

## Command

derive-set-of-due-events reads one JSON value per input line and writes one JSON value per output line.

## Examples

### one event never done is due

Input:

~~~json
{
  "events": [
    {
      "id": "daily-standup",
      "dtstart": "19970902T090000Z",
      "rrule": "FREQ=DAILY;COUNT=10"
    }
  ],
  "now": "1997-09-05T00:00:00Z"
}
~~~

Output:

~~~json
{
  "due": [
    {
      "id": "daily-standup",
      "occurrence": "1997-09-04T09:00:00.000Z",
      "reason": "never-done"
    }
  ]
}
~~~

### an event done since its last occurrence is not due

Input:

~~~json
{
  "events": [
    {
      "id": "daily-standup",
      "dtstart": "19970902T090000Z",
      "rrule": "FREQ=DAILY;COUNT=10"
    }
  ],
  "now": "1997-09-05T00:00:00Z",
  "lastDone": {
    "daily-standup": "1997-09-04T10:00:00Z"
  }
}
~~~

Output:

~~~json
{
  "due": []
}
~~~
