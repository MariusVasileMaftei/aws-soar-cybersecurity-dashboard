# AWS-Based SOAR Platform for Automated Brute-Force Detection & Incident Response

## Overview
This repository contains the frontend component of a custom **Security Orchestration, Automation, and Response (SOAR)** platform designed to monitor infrastructure logs, detect authentication anomalies, and execute automated mitigation playbooks.

To enforce cybersecurity best practices regarding **Credential and Secret Exposure**, the production backend API gateways and environment configuration variables are completely decoupled from the repository code. The application dynamically injects configuration values from a localized, non-committed configuration layer during execution.

---

## Architectural Workflow
The system components interact seamlessly within an enterprise cloud architecture to provide real-time telemetry and defensive orchestration:

1. **Ingestion (Traffic Simulation):** A local network emulator (`simulator.py`) generates legitimate user authentication traffic and a high-rate brute-force attack vector against target profiles.
2. **Authentication Gateway:** Requests pass through an AWS API Gateway acting as a secure public entry point.
3. **Identity Management & Auditing:** An AWS Lambda function (`soar-auth`) intercepts payloads, attempts validation against an AWS Cognito User Pool, and writes structured audit logs to an Amazon DynamoDB state table.
4. **Analysis & Correlation:** A second microservice (`soar-events`) evaluates log telemetry against specific sliding-window alert definitions.
5. **Asynchronous Alerting & Response:** When an active brute-force footprint is detected, an anomaly signal is dispatched via an AWS SQS queue to an alerting Lambda (`soar-alerter`), triggering immediate notification via Amazon SNS (Email notification) and archiving a downloadable forensic CSV report inside a secured Amazon S3 bucket.
6. **Visualization Dashboard:** A real-time, low-overhead administrative dashboard renders security metrics and audit tables, polling live telemetry without exposing underlying AWS resources directly to the internet.

---

## Repository Structure
```text
soar-project/
│
├── frontend/                 # Source code committed to GitHub
│   ├── dashboard.html        # Main Security Operations Center (SOC) view
│   ├── style.css             # UI styling sheets
│   └── app.js                # Core API polling and asynchronous UI DOM updates
│
├── .gitignore                # Restricts sensitive local data from being published
├── config.js                 # LOCAL ONLY: Contains private AWS API endpoints
│
└── backend_simulator/        # LOCAL ONLY: Testing and data generation tools
    └── simulator.py          # Python behavioral emulation script

    