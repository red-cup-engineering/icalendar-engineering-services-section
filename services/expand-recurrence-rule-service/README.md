# @red-cup-engineering/expand-recurrence-rule-service

Expands one iCalendar (RFC 5545) VEVENT's recurrence into the UTC occurrence instants falling within a window, composing the rrule package's own rrulestr/RRuleSet for all RRULE, EXDATE, and RDATE set arithmetic.

## Operation

~~~js
export function expandRecurrenceRule(request)
~~~

### Parameters

- request ({dtstart: string, rrule?: string, exdate?: string[], rdate?: string[], window: {start: string, end: string}}): A record naming the VEVENT's DTSTART (RFC 5545 basic UTC form), an optional RRULE value (the text after "RRULE:"), optional EXDATE/RDATE basic-UTC value arrays, and the window {start, end} (any Date-parseable ISO 8601 instants) to expand within.

### Returns

{occurrences: string[]}: The occurrence instants within the window, as ascending ISO 8601 UTC strings.

### Refusals

- TypeError: When request.dtstart is not a string, or request.window.start/end is not a string.
- Error: When dtstart or any exdate/rdate value is not an RFC 5545 basic UTC date-time.

## Command

expand-recurrence-rule reads one JSON value per input line and writes one JSON value per output line.

## Examples

### daily for 10 occurrences

Input:

~~~json
{
  "dtstart": "19970902T090000Z",
  "rrule": "FREQ=DAILY;COUNT=10",
  "window": {
    "start": "1997-09-01T00:00:00Z",
    "end": "1997-12-31T00:00:00Z"
  }
}
~~~

Output:

~~~json
{
  "occurrences": [
    "1997-09-02T09:00:00.000Z",
    "1997-09-03T09:00:00.000Z",
    "1997-09-04T09:00:00.000Z",
    "1997-09-05T09:00:00.000Z",
    "1997-09-06T09:00:00.000Z",
    "1997-09-07T09:00:00.000Z",
    "1997-09-08T09:00:00.000Z",
    "1997-09-09T09:00:00.000Z",
    "1997-09-10T09:00:00.000Z",
    "1997-09-11T09:00:00.000Z"
  ]
}
~~~

### a VEVENT without RRULE occurs once, at DTSTART

Input:

~~~json
{
  "dtstart": "19970902T090000Z",
  "window": {
    "start": "1997-01-01T00:00:00Z",
    "end": "1998-01-01T00:00:00Z"
  }
}
~~~

Output:

~~~json
{
  "occurrences": [
    "1997-09-02T09:00:00.000Z"
  ]
}
~~~
