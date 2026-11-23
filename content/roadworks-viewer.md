---
slug: "roadworks-viewer"
status: "ready"
title: "NAP Roadworks Viewer: Is this road really closed?"
authors: ["Jonas Matthias (Graphmasters GmbH)"]
topics: ["data-quality", "traffic-management"]
keywords: ["DATEX II", "data quality", "roadworks and road closures", "TISA RTTI 5-Star", "OpenStreetMap", "open-source NAP tools"]
annotation: "NAP Roadworks Viewer is an open-source browser tool that checks DATEX II roadworks and closure feeds from National Access Points: schema and profile checks, selected TISA RTTI 5-Star criteria, OpenStreetMap matching and lane-level passability. It also flags conflicting records, e.g. a road closure whose linked cause only prohibits parking."
email: "jonas.matthias@graphmasters.net"
---

Is this road really closed? NAP Roadworks Viewer: check DATEX II roadworks feeds and link them to
the road network, lane by lane Dr. Jonas Matthias Graphmasters GmbH jonas.matthias@graphmasters.net
Mobility Data Days Athens 25–26 Nov 2026

Lanes, not pins

Visible quality

From feed to road

Free, open, private

Which lanes, directions and road users are affected.

Selected TISA RTTI 5-Star criteria, file by file.

Each record matched to OpenStreetMap ways.

Apache-2.0. Runs in the browser, no upload.

Why it matters 3 1

NAPs publish roadworks as DATEX II. Navigation needs more than a coordinate: which road, direction
and lanes and is it really impassable? DATEX II file v2 or v3, local

2

Check schema, profile, RTTI

Locate map, OSM ways

Fig. 1 NAP Roadworks Viewer showing the DATEX II feed from lbv-sh.de, 9 Nov 2026, a positive example
of a feed that reports cycle path closures. 1 Records and filters. 2 Record geometry on the map. 3
Lane status from DATEX II and OSM road network data.

Interpret lanes vs. OSM

Routing hint block pass review

Restricted closed

Closed or not?

RTTI 5-Star Rating

Cycle-path works on the 49 near Puttgarden (Fehmarn). Lane code Fu2o: cycle path closed, both
driving lanes open, as in OSM.

36, Gleschendorf: a roadClosed record whose cause only says H2H (no stopping/parking, lanes are open
for driving). The viewer flags a potential inconsistency.

One file only gives a ceiling. Typical problems and fixes:

Fig. 2 Lane status decoded by the viewer. LBV.SH record 3530528-...-5688423.

Routing hint: passable, do not block.

Fig. 3 Situation 6189722 (DQ-RW-001): closure conflicting, cause passable. LBV.SH.

Routing hint: manual review; only the publisher can tell.

Criterion Polyline

Problem fix point only critical add a line Direction not tied to the line state it on the line
Message ID reused stable unique IDs Correctness closure vs. cause resolve conflicts Completeness end
time missing add end time Format DATEX II v2 high v3 ref. profile Location coordinates only add
OpenLR

Max 0 5

Critical criteria limit the overall rating most.

What it does not do

Try it with your NAP feed

No update cycle, timeliness or availability from one file. Ceilings from selected criteria, not an
official TISA rating. Match scores rank candidates; they are not probabilities. A flagged
contradiction calls for review; it proves no error.

1. Open graphmasters.github.io/ nap-roadworks-viewer 2. Drop in a DATEX II file Which checks do you
need? Issues and pull requests welcome.

github.com/Graphmasters/

References. TISA, RTTI 5-Star Rating Specification v1.0 (21 Oct 2025), tisa.org DATEX II v2/v3;
German MDM roadworks profile 04-00-00 OpenStreetMap: OpenStreetMap contributors (ODbL),
openstreetmap.org/copyright. Data: Landesbetrieb Straßenbau und Verkehr Schleswig-Holstein (LBV.SH),
strasseninfo-sh.de, via Mobilithek, mobilithek.info/offers/110000000003237002, snapshot 2026-11-09.
Software: NAP Roadworks Viewer, Apache-2.0, commit 51bc825; code generated with Claude (Anthropic)
under human direction and review.
