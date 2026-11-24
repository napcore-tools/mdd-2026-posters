---
slug: "inqms"
status: "ready"
title: "Integrated Quality Management System"
authors: ["Jan Vlčinský"]
topics: ["data-quality", "interoperability"]
keywords: ["InQMS", "Data Quality", "Validation"]
annotation: "InQMS collects a publisher's data feeds by pull or push, archives every sample and checks its size, update interval, schema validity and record counts. Grafana dashboards show the daily rhythm of the data, and alert rules notify the team as soon as a feed becomes unavailable or its quality drops. It runs for the Czech NAP, Project Crocodile and the DATEX@NAPs study."
email: "jan.vlcinsky@tamtamresearch.com"
---

From raw feed to quality insight

See the rhythm of your data

One feed, 24 hours

Real data from a monitored distribution

How we cooperate

YOU PROVIDE YOU GET

InQMS

Data publisher

(you)

Your team

quality manager,

analyst (you)

Instructions to consume your data

XML JSON schema and rules to count records

Your expectations for live monitoring

Collector

we PULL you PUSH

Archive

AWS S3 gzipped samples

Evaluator

schema validity record counts

Metrics store

PostgreSQL Prometheus

Grafana (Cloud)

dashboards alert rules notifications

Consumption protocol spec Access to the S3 archive Basic data metrics Size frequency report

Standard metrics Structural quality report

Proposal for alerting rules Integration with your monitoring system

Who it is for

As a data publisher I want to assess the quality of my data to plan improvements.

I want to get notified as soon as accessibility fails or quality of my data breaks, to keep my SLA
within limits.

As a solution provider I want to assess the quality and metrics of my input data.

As an analyst I want to have access to an archive of my input data samples.

What we can connect to

AUTHENTICATION HTTP Basic mTLS client certificate OAuth 2.0 Custom HTTP headers Query string
parameters Host-based No authentication Extensible...

VALIDATION DATEX II 1.x DATEX II 2.x DATEX II 3.x Custom XSD JSON Schema

In operation

Project Crocodile Collecting data from Czechia, Hungary and Austria.

Czech NAP Collecting, validating and monitoring all published content.

NAPCORE DATEX@NAPs study Collecting and evaluating quality of SRTI data from all EU countries.

Product inqms.tamtamresearch.com

DATEX@NAPs study datex2.naps.inqms.cz

LAST 24 HOURS AS OF 23 NOV 2026

17 38

6 672 32 479

Jan Vlčinský TamTam Research s.r.o. jan.vlcinsky@tamtamresearch.com

Integrated Quality Management System

The care your data deserves

1 Collect

PULL we fetch (HTTP GET)

PUSH you send (POST PUT)

Many authentication methods

Conditional requests deduplication

2

Samples stored gzipped with metadata

Browse and download any sample

3 Evaluate

Basic size update interval

Standard XML/JSON valid schema valid number of records

Extended customizable

4 Integrate

AWS S3 storage

PostgreSQL sample metadata

Prometheus metrics

Loki log aggregation

visualization

5 Monitor notify

Define rules

Get notified when accessibility fails

Get notified when quality breaks

Sample size, plain and gzipped

Records per sample

Daily traffic rhythm at a glance

Sessions with errors Sessions w/o problems

Samples with errors Total samples

Project TH03010503 Integrated Quality Measurement System (InQMS) was cofinanced with the state
support of the Technology Agency of the Czech Republic within the Epsilon Program.
