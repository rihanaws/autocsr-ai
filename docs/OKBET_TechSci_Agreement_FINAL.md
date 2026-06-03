# **DATA ACCESS, USAGE & MUTUAL SERVICE AGREEMENT**

WITH INTELLECTUAL PROPERTY OWNERSHIP DECLARATION

| PARTY A — LICENSOR / DATA PROVIDER | PARTY B — LICENSEE / DEVELOPER |
| :---- | :---- |
| **Gavin	Ventures,	Inc.	(Operating	as OKBET)** | **TechSci, Inc.** |
| Represented by: Wayne Thong Chief Operating Officer | Represented by: Sayem Abdullah Rihan Authorized Signatory |
| Kingston Excell Bldg., Centennial/Civic Drive, Filinvest, Alabang, Muntinlupa City, NCR – Fourth District, Philippines | 244 5th Ave, Suite \#1950 New York, NY 10001 United States of America |

This Data Access, Usage and Mutual Service Agreement ("Agreement") is entered into as of **June 2, 2026 ("Effective Date")** by and between the Parties identified above. This Agreement shall be governed by the mutually agreed laws of the Republic of the Philippines and the People's Republic of Bangladesh, as applicable to each Party's jurisdiction of incorporation and operation.

# **RECITALS**

WHEREAS, Gavin Ventures, Inc. (operating as OKBET) operates an online betting and gaming platform employing customer service representatives ("CSR Agents") who manage high-volume customer queries, particularly related to deposit and payment issues, via a LiveAgent-based live chat platform;

WHEREAS, TechSci, Inc., through its authorized signatory Sayem Abdullah Rihan (who is also a current employee of OKBET), is engaged in the development of an AI-powered CSR automation tool ("the Product") and requires access to real-time operational chat data for model training purposes;

WHEREAS, both Parties acknowledge that OKBET's operational data contributes direct commercial value to the Product, and therefore agree to a mutual exchange: data access in consideration for a complimentary Product deployment period;

WHEREAS, OKBET expressly authorizes TechSci, Inc. to collect data under the terms herein, and both Parties agree this constitutes a fully consensual, documented arrangement with no element of unauthorized access or data misappropriation;

NOW, THEREFORE, in consideration of the mutual covenants herein, the Parties agree as follows:

1. # **DEFINITIONS**

For the purposes of this Agreement:

1. **"Licensed Data"** means all data accessible to TechSci, Inc. through OKBET's LiveAgent live-chat platform during authenticated CSR agent sessions, including chat transcripts, customer-submitted content (text, images, attachments, and media files), query categories, ticket metadata, agent responses, resolution outcomes, and any other data rendered in the client-side browser environment during an active session.

   2. **"Anonymized Data"** means Licensed Data from which all PII — including customer names, account numbers, emails, phone numbers, and financial credentials — has been removed, masked, or replaced with synthetic tokens prior to storage.

   3. **"The Product"** means any AI model, software, SaaS platform, API service, browser extension, inference pipeline, or derivative work developed by TechSci, Inc. using or trained on the Licensed Data.

   4. **"Model Weights"** means the numerical parameters, fine-tuned layers, LoRA adapters, vector embeddings, and all trained artifacts derived from the training process using Licensed Data.

   5. **"Data Collection Period"** means the six (6) calendar month window commencing on the Effective Date, during which TechSci, Inc. is authorized to collect Licensed Data.

   6. **"Complimentary Service Period"** means the six (6) calendar month period following successful Product deployment during which OKBET shall receive full Product access at no charge.

   7. **"Authorized Collection Device"** means any computing device operating from the IP addresses registered in Exhibit C of this Agreement.

   8. **"LiveAgent Session"** means an authenticated login session conducted by Sayem Abdullah Rihan on the OKBET LiveAgent platform using standard employee credentials.

2. # **GRANT OF DATA ACCESS LICENSE**

Subject to the terms of this Agreement, OKBET grants TechSci, Inc. a **non-exclusive, non-transferable, time-limited, royalty-free license** to:

1) Access and extract Licensed Data during active LiveAgent Sessions via client-side browser-based tools, including a custom browser extension operating within Chrome or Zen Browser;

2) Capture all data types rendered in the client-side browser environment during authenticated sessions, including: chat text (agent and customer), customer-submitted images and file attachments, ticket status and metadata, issue category labels, ARIA context, resolution status markers, and session timing data;

3) Store Anonymized Data on TechSci, Inc.'s secured local systems and private encrypted storage, solely for training and evaluating the Product;

4) Process and transform Licensed Data into training datasets, vector embeddings, and AI model inputs as required for Product development.

   1. **Scope of Authorization.** OKBET expressly acknowledges that the data collection method described above — client-side DOM extraction within an authenticated employee session — constitutes authorized access. TechSci, Inc. is not bypassing any authentication system, accessing any backend API without permission, or exceeding its authorized access level. All data collected is data OKBET has already made visible to the authenticated user through normal platform operation.

   2. **No Backend Manipulation.** The data collection process shall be purely passive and read-only. No data on OKBET's servers shall be created, modified, deleted, or manipulated. No requests shall be made to OKBET's backend APIs beyond those normally generated by standard platform usage.

3. # **DATA COLLECTION PERIOD AND EXPIRY**

   1. **Authorized Period.** TechSci, Inc. is authorized to collect Licensed Data for **six (6) calendar months** commencing June 2, 2026, expiring automatically at 23:59:59 on **December 2, 2026**.

   2. **Automatic Expiry.** Upon expiry, TechSci, Inc.'s right to collect new Licensed Data ceases immediately and automatically. The browser extension or any collection tool must be disabled. TechSci, Inc. shall confirm deactivation in writing within five (5) business days of expiry.

   3. **Retained Data.** All Licensed Data lawfully collected during the Data Collection Period may be retained by TechSci, Inc. in anonymized form and used for model training, evaluation, and Product development without time restriction, subject to Sections 7 and 8\.

   4. **Extension.** The Data Collection Period may be extended by mutual written agreement signed by authorized representatives of both Parties prior to expiry.

   5. **All Media Types Included.** For the avoidance of doubt, authorization covers all data types in Section 2(b), including customer-submitted images, file attachments, and all media rendered within the LiveAgent session interface.

4. # **INTELLECTUAL PROPERTY OWNERSHIP**

   1. **Sole Ownership by TechSci, Inc.** TechSci, Inc. shall be the sole and exclusive owner of all right, title, and interest in and to: (i) the Product in all forms and versions; (ii) all Model Weights and fine-tuned artifacts; (iii) all software code, architecture, APIs, and interfaces; (iv) all patents, copyrights, trade secrets, and trademarks arising from development of the Product; (v) all training datasets and vector databases derived from anonymized Licensed Data.

   2. **No OKBET Ownership.** The grant of data access under Section 2 does not confer upon OKBET any ownership interest, equity stake, license right, or claim over the Product or Model Weights unless separately agreed in a subsequent written instrument.

   3. **No Work-for-Hire.** Development of the Product by TechSci, Inc. is not performed as an employee or contractor of OKBET for purposes of this Agreement. The Product does not constitute work-for-hire under applicable copyright law.

   4. **NDA and Employment Contract Carve-Out.** Both Parties agree this Agreement constitutes an authorized carve-out from any prior NDA, employment agreement, or IP assignment clause. All IP developed by TechSci, Inc. using Licensed Data is explicitly excluded from any prior IP assignment or work-for-hire provisions. OKBET, through its COO Wayne Thong, confirms it has authority to grant this carve-out.

5. # **MUTUAL SERVICE EXCHANGE — COMPLIMENTARY DEPLOYMENT**

Both Parties acknowledge OKBET's Licensed Data is a material contribution to the Product. In recognition, the Parties agree:

1. **Complimentary Service Period.** TechSci, Inc. shall provide OKBET full, unrestricted Product access — all features, full query processing capacity, full support — for **six (6) calendar months** from the Go-Live Date, entirely free of charge.

   2. **No Restrictions During Free Period.** The Complimentary Service Period shall not be subject to query volume caps, feature restrictions, or service level degradation. OKBET receives the same quality of service as any paying commercial customer.

   3. **Right of First Offer.** Upon expiry of the Complimentary Service Period, TechSci, Inc. shall offer OKBET a commercial subscription at pricing no less favorable than the lowest price offered to any third-party customer of equivalent query volume.

   4. **Exclusive Window.** TechSci, Inc. shall not market or deploy the Product to any direct competitor of OKBET in OKBET's primary markets during the Complimentary Service Period without OKBET's prior written consent.

   5. **Progress Updates.** TechSci, Inc. shall provide OKBET a good-faith estimated completion timeline within thirty (30) days of the Effective Date, and written monthly progress updates during the Data Collection and development period.

6. # **AUTHORIZED COLLECTION DEVICES AND IP ADDRESSES**

   1. **Registered IPs.** TechSci, Inc. shall conduct all data collection exclusively from the IP addresses listed in Exhibit C. OKBET acknowledges that network traffic originating from these registered IPs in connection with LiveAgent sessions constitutes authorized activity under this Agreement.

   2. **Security Whitelist.** Upon execution, OKBET shall inform its IT and security personnel that the IP addresses in Exhibit C are authorized for CSR session activity. No security flags, blocks, or investigations shall be initiated solely on the basis of data collection activity originating from these addresses during the Data Collection Period.

   3. **IP Change Notification.** TechSci, Inc. shall provide written notice to OKBET at least forty-eight (48) hours prior to collecting from any IP not listed in Exhibit C. Exhibit C may be updated by mutual written consent.

   4. **No Security Bypass.** Both Parties confirm the authorized activity does not involve bypassing, disabling, or circumventing any security control, authentication system, or access restriction. All activity occurs within the normal, authenticated browser session of a registered OKBET employee.

7. # **DATA PROTECTION AND PII OBLIGATIONS**

   1. **Anonymization.** All customer PII shall be stripped, masked, or tokenized before any Licensed Data is written to persistent storage. Raw PII shall not be retained beyond the processing session.

   2. **Security Standards.** TechSci, Inc. shall apply AES-256 encryption to all stored Licensed Data and restrict access to authorized personnel only.

   3. **No Third-Party Disclosure.** TechSci, Inc. shall not sell, transfer, publish, or disclose raw Licensed Data or OKBET Confidential Business Information to any third party without prior written consent from OKBET.

   4. **Raw Data Deletion.** Upon expiry of the Data Collection Period, TechSci, Inc. shall permanently delete all raw (non-anonymized) Licensed Data and provide written confirmation within fourteen (14) business days.

   5. **Retention of Anonymized Artifacts.** Anonymized training datasets, vector embeddings, and Model Weights may be retained indefinitely for Product development.

8. # **CONFIDENTIALITY**

Each Party agrees to hold the other's Confidential Business Information in strict confidence and not disclose it to any third party during the term of this Agreement and for **three (3) years** thereafter. Exceptions: (a) information publicly known through no breach hereof; (b) independently developed without use of disclosing Party's information; (c) required by applicable law or valid court order with prompt written notice where legally permissible.

9. # **REPRESENTATIONS AND WARRANTIES**

1) Each Party has full legal authority to enter into this Agreement;

2) This Agreement does not conflict with any other agreement to which either Party is bound;

3) **OKBET warrants** it has the legal right to grant access to the Licensed Data and that Wayne Thong, as COO, has authority to execute this Agreement on OKBET's behalf;

4) **TechSci, Inc. warrants** the Product will be developed in compliance with applicable laws and will not be used to facilitate any unlawful purpose;

5) **TechSci, Inc. warrants** the data collection process shall remain purely read-only and passive. No OKBET backend systems shall be accessed, modified, or manipulated beyond what is produced by standard authenticated platform use.

10. # **TERM AND TERMINATION**

    1. **Term.** This Agreement commences on the Effective Date and continues until the later of: (a) expiry of the Data Collection Period; or (b) expiry of the Complimentary Service Period, unless earlier terminated.

    2. **Termination for Cause.** Either Party may terminate upon thirty (30) days' written notice of material breach if the breach is not cured within that period.

    3. **Survival.** Sections 4 (IP Ownership), 7.3 (No Third-Party Disclosure), and 8 (Confidentiality) shall survive termination indefinitely.

11. # **LIMITATION OF LIABILITY**

To the maximum extent permitted by applicable law, neither Party shall be liable for any indirect, incidental, consequential, or punitive damages. Each Party's total aggregate liability shall not exceed USD 5,000 or the total commercial value exchanged under this Agreement in the preceding twelve months, whichever is greater.

12. # **GOVERNING LAW AND DISPUTE RESOLUTION**

This Agreement is governed by the laws mutually applicable to both Parties: the **Republic of the Philippines** (as applicable to Gavin Ventures, Inc. / OKBET) and the **People's Republic of Bangladesh** (as applicable to Sayem Abdullah Rihan / TechSci, Inc.), with both Parties agreeing to apply the most relevant jurisdiction's law to the specific matter in dispute.

Disputes shall first be subject to good-faith negotiation for **thirty (30) days**. If unresolved, disputes shall be submitted to **binding arbitration before a mutually agreed, neutral arbitrator**, conducted in English at a location mutually agreed at the time of the dispute. The arbitrator's decision shall be final and binding.

13. # **GENERAL PROVISIONS**

    1. **Entire Agreement.** This Agreement and all Exhibits constitute the entire agreement between the Parties and supersede all prior discussions and agreements.

    2. **Amendments.** No amendment shall be effective unless in writing and signed by authorized representatives of both Parties.

    3. **Severability.** If any provision is found invalid, the remaining provisions remain in full force and effect.

    4. **Counterparts.** This Agreement may be executed in counterparts, including electronic or digital signatures, each deemed an original.

    5. **Notices.** All notices shall be in writing, delivered to the addresses on page 1, or via email to addresses mutually agreed in writing.

    6. **Language.** English is the controlling language for all interpretations and disputes.

# **SIGNATURES**

IN WITNESS WHEREOF, the authorized representatives of both Parties have executed this Agreement as of the Effective Date first written above.

| FOR GAVIN VENTURES, INC. (OKBET) Licensor / Data Provider | FOR TECHSCI, INC. Licensee / Developer |
| :---- | :---- |
| Signature: | Signature: |
|   |   |
| Printed Name: **Wayne Thong** | Printed Name: **Sayem Abdullah Rihan** |
| Title: **Chief Operating Officer, OKBET** | Title: **Authorized Signatory, TechSci, Inc.** |
| Date: **June 2, 2026** | Date: **June 2, 2026** |
| Company Seal / Stamp: | Company Seal / Stamp: |
|  |  |

Both Parties confirm they have read, understood, and voluntarily agree to all terms of this Agreement including all Exhibits attached hereto.

# **EXHIBIT A — APPROVED DATA COLLECTION METHODS**

| Method | Description | Approved |
| :---- | :---- | ----- |
| Browser Extension (Primary) | Client-side DOM extraction running in Chrome/Zen Browser during au LiveAgent sessions. Uses MutationObserver \+ ARIA attributes. Read- | th■enYtiecaste■d No only. Zero backend |
| Direct DB Export | Bulk CSV/JSON export of historical anonymized chat logs from OKBE | T■daYtaebsas■e No |
| Read-Only API | Programmatic read-only access to OKBET's LiveAgent API endpoints | Yes ■ No |
| Webhook / RT Feed | OKBET pushes anonymized session data to TechSci endpoint on ses | si■onYcelosse■ No |
| Manual Export | Periodic manual export of session logs by OKBET authorized staff | Yes ■ No |

OKBET authorizes the following data collection methods (COO to tick applicable boxes):

API calls.

# **EXHIBIT	B	—	AUTHORIZED	DATA	CATEGORIES	AND	ANONYMIZATION TREATMENT**

| Data Type | Included | Anonymization |
| :---- | :---- | :---- |
| Chat transcript text (agent & customer) | Yes | Customer names → \[NAME\] |
| Customer-submitted images & screens | hoYtess | File metadata stripped; content retained for training |
| Customer-submitted file attachments | Yes | Personal filenames stripped; content retained |
| Query / issue category labels | Yes | None required |
| Ticket status and metadata | Yes | None required |
| Resolution outcome | Yes | None required |
| Time-to-resolution (ms) | Yes | None required |
| Agent response text | Yes | None required |
| Session timing and duration | Yes | None required |
| ARIA / UI context labels | Yes | None required |
| Customer account ID / username | No | Replaced with \[ACCOUNT\_ID\] |
| Customer real name | No | Replaced with \[NAME\] |

| Customer email / phone | No | Replaced with \[EMAIL\] / \[PHONE\] |
| :---- | :---- | :---- |
| Transaction amounts (exact) | No | Replaced with range token (SM/MD/LG) |
| Payment credentials / card details | No | Not collected — stripped at source |
| Customer location / address | No | Not collected — stripped at source |

**EXHIBIT C — AUTHORIZED DEVICE IP ADDRESSES**

| \# | Dedicated IP Address | Purpose / Device | Registered By |
| :---: | :---- | :---- | :---- |
| 1 | 153.53.253.81 | Primary workstation — data collection device | Sayem Abdullah Rihan / TechSc |
| 2 | 89.117.176.115 | Secondary device — backup collection node | Sayem Abdullah Rihan / TechSc |
| 3 | 103.170.173.26 | Tertiary device — development environment | Sayem Abdullah Rihan / TechSc |

The following IP addresses are registered as Authorized Collection Devices under Section 6\. OKBET's IT/security team shall whitelist these addresses for the full Data Collection Period (June 2, 2026 – December 2, 2026). TechSci, Inc. warrants that all data collection shall originate exclusively from these registered addresses.

i, Inc.

i, Inc.

i, Inc.

# **EXHIBIT C — CO-SIGNATURE CONFIRMATION**

Both Parties confirm the IP addresses listed above are accurate, complete, and authorized under Section 6 of this Agreement:

| OKBET (Gavin Ventures, Inc.) | TechSci, Inc. |
| :---- | :---- |
| Signature: | Signature: |
|   |   |
| Name: **Wayne Thong** | Name: **Sayem Abdullah Rihan** |
| Title: **Chief Operating Officer** | Title: **Authorized Signatory** |
| Date: **June 2, 2026** | Date: **June 2, 2026** |
|  |  |

Document Ref: OKBET-TECHSCI-DAA-FINAL | Gavin Ventures, Inc. & TechSci, Inc. | Effective: June 2, 2026 | Data Collection Expires: December 2, 2026

This document is legally binding. Both Parties are advised to retain independent legal counsel. Exhibit A must have applicable methods ticked and initialed by Wayne Thong before execution is complete.