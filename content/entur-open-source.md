---
slug: "entur-open-source"
status: "ready"
title: "ENTUR: Open-source tools for public transport data"
authors: ["Brede Dammen", "Johan Wiklund"]
topics: ["interoperability", "data-in-use", "data-quality"]
keywords: ["Open-source tools", "Entur"]
annotation: "The tools behind national journey planning and open data in Norway are open source. Entur’s toolchain covers the whole data chain, from a national stop place registry to data production, aggregation, validation, journey planning with OpenTripPlanner and visualisation. Several tools are co-developed with Fintraffic, partners in Italy, Germany and Sweden, ERA and more."
email: "brede.dammen@entur.org"
---

Collaboration marks the tools we build with partners Open-source tools for public transport data The
tools behind national journey planning and open data in Norway are open source. We build several of
them together with Fintraffic, partners in Italy, Germany and Sweden, ERA and more.

01 Stop places One description and one ID for every stop 02 Produce data Tools for creating data for
the National Access Point 03 Aggregate From many sources to one national dataset 04 Validate
Detailed reports that data providers can act on 05 Use Journey planning, search and notifications 06
Visualise See what the data contains

National Stop Place Registry A central registry for all public transport stops in Norway. It keeps
stop data consistent and up to date with versioning and validation, and exports to NeTEx for journey
planners, scheduling tools and public APIs. entur/tiamat entur/abzu

NPlan Timetable planning for small operators and flexible transport services. Exports data to NeTEx.

Vehicle Map Vehicle positions from SIRI Vehicle Monitoring feeds, on a map.

Avvik Deviation messages, cancellations and extra journeys as SIRI-SX and SIRI-ET.

entur/uttu entur/enki

entur/vehicle-map-demo

entur/enlil entur/nirgali

Anshar Real-time hub. Collects and normalises SIRI-ET, SIRI-VM and SIRI-SX from many operators into
one consistent stream. entur/anshar

Lamassu Mobility hub. Validates and distributes GBFS feeds for e-scooters, city bikes and shared
cars. entur/lamassu

NeTEx Validation Library Validates NeTEx files with XML Schema, XPath and objectmodel rules. Works
with any national or local NeTEx profile. entur/netex-validator-java

Antu Checks datasets against the Nordic NeTEx Profile, and stop references against the stop place
registry. entur/antu

OpenTripPlanner Multimodal journey planner with an active worldwide community. Uses NeTEx, SIRI,
GBFS and GTFS to generate trip suggestions. entur/OpenTripPlanner

Ukur Finds the relevant changes in SIRI feeds and pushes them to travellers. entur/ukur

Extime Converts flight and airport data from Avinor into NeTEx datasets. entur/extime

Geocoder Finds addresses, place names, points of interest and stop places. Built on Photon.
entur/geocoder

Mobility Map Shared bikes and scooters from GBFS feeds through Lamassu, on a single map.
entur/mobility-map-demo

All the tools on one page github.com/entur/Transportdata-open-source-intro Interested in one or more
of the projects? Let us make a difference together. kollektivdata@entur.org
