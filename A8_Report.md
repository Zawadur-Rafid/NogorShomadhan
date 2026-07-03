|**Contents**|**Contents**|**Contents**|||
|---|---|---|---|---|
|**1**|**Problem Statement**|||**1**|
|**2**|**Project Objectives**|||**1**|
|**3**|**Finalized Features**|||**2**|
||3.1|Registration & Authentication . . . . . . . . . . . . . . . . . . . . . . . .||2|
||3.2|Issue Reporting . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|2|
||3.3|Issue Map View . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|2|
||3.4|Issue Status Tracking . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|2|
||3.5|Authority Dashboard . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|3|
||3.6|Analytics<br>. . . . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|3|
||3.7|Comments & Feedback . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|3|
||3.8|AI-Powered Smart Features|. . . . . . . . . . . . . . . . . . . . . . . . .|3|
||3.9|Notifcations . . . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|4|
|**4**|**ER **|**Diagram**||**5**|
|**5**|**Tentative UI Pages**|||**6**|
||5.1|Public Pages . . . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|6|
||5.2|ResidentCitizen/User Module|. . . . . . . . . . . . . . . . . . . . . . . .|6|
||5.3|Community Authority Module . . . . . . . . . . . . . . . . . . . . . . . .||7|
||5.4|Admin Module<br>. . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|8|
|**6**|**Tentative APIs**|||**9**|
||6.1|Authentication APIs . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|9|
||6.2|Public APIs . . . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|9|
||6.3|Resident/User APIs . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|9|
||6.4|Community Authority APIs|. . . . . . . . . . . . . . . . . . . . . . . . .|10|
||6.5|Admin APIs . . . . . . . . .|. . . . . . . . . . . . . . . . . . . . . . . . .|11|
|**7**|**App Review**|||**13**|
|**8**|**Contribution Table**|||**15**|



i 

## **1. Problem Statement** 

Residents of residential communities frequently encounter local infrastructure and maintenance issues, including damaged roads, faulty streetlights, water leakage, overflowing garbage bins, drainage problems, broken park facilities, and security-related concerns. Although these issues directly affect residents’ daily lives, many communities still rely on phone calls, social media groups, or informal messaging to report complaints, resulting in poor organization and delayed responses. 

The consequences of this gap are significant: 

- Residents have no centralized platform to report issues with supporting evidence such as photographs, location, and detailed descriptions. 

- Community management offices receive complaints through multiple disconnected channels, making it difficult to organize, prioritize, and assign tasks efficiently. 

- Duplicate reports, missing information, and the lack of a structured tracking system lead to delayed resolutions and reduced transparency. 

- Residents have limited visibility into the progress of their reported issues, reducing trust in community management. 

The absence of a structured digital reporting and monitoring system results in inefficient maintenance, slower response times, and reduced quality of life within the residential community. 

## **2. Project Objectives** 

The primary goal of Nogor Shomadhan is to establish a transparent and efficient communication platform between residents and community management authorities within a residential community. The project is guided by the following objectives: 

- i. To develop a mobile-based platform that enables residents to report community maintenance and infrastructure issues in real time using photographs, location information, and detailed descriptions. 

1 

- ii. To integrate Artificial Intelligence (AI) for automatic complaint categorization and duplicate report detection, enabling community administrators to manage and prioritize complaints more efficiently. 

- iii. To improve transparency and community management by providing a centralized dashboard for monitoring and resolving complaints while allowing residents to track the status of their reports throughout the resolution process. 

## **3. Finalized Features** 

## **3.1 Registration & Authentication** 

Users can register and log in securely through a verified authentication system. Profile management is supported for all user types including residents, community authority staff and administrators. 

## **3.2 Issue Reporting** 

Residents can submit civic complaints by providing a title, written description, geographic location and photographic evidence. This ensures each report is complete and structured upon submission. 

## **3.3 Issue Map View** 

An interactive map displays all reported issues as location markers. Users can tap any marker to view the full details of that issue, providing both residents and authorities with a clear geographic overview of ongoing problems. 

## **3.4 Issue Status Tracking** 

Each complaint follows a defined status lifecycle: 

_Pending → InProgress → Resolved_ 

Residents can view a full history of status changes for any issue they have submitted or are following, ensuring transparency throughout the resolution process. 

2 

## **3.5 Authority Dashboard** 

A dedicated dashboard is provided for community authority users. It allows them to view all submitted complaints, update issue statuses and apply filters and search to manage reports efficiently. 

## **3.6 Analytics** 

The platform provides a comprehensive analytics dashboard to assist community management in monitoring complaint trends and making data-driven decisions. Visual reports are presented through graphs and charts, including issue distribution by category, block or area-wise complaint distribution, monthly complaint trends, and the ratio of resolved versus pending issues. Additionally, resolution time statistics are provided to help evaluate maintenance performance, identify recurring problem areas, and allocate resources more effectively. 

## **3.7 Comments & Feedback** 

Residents can leave comments under reported issues and rate the quality of resolution once an issue is closed. Additionally, any resident can increment an urgency counter on an existing report, allowing the community to collectively signal which issues require the most immediate attention. 

## **3.8 AI-Powered Smart Features** 

The platform incorporates Artificial Intelligence to improve the efficiency and accuracy of complaint management through the following capabilities: 

- **Automatic Complaint Categorization:** Upon submission, an AI model automatically classifies each complaint into the appropriate issue category without requiring manual input. 

- **Duplicate Complaint Detection:** The system automatically identifies and flags reports that are similar or identical to existing complaints, preventing redundant entries and maintaining a clean, organized database. 

3 

## **3.9 Notifications** 

The platform provides a real-time notification system to keep both residents and community management informed about important updates. Residents receive notifications when their complaint is submitted, assigned, updated, or resolved. Community management staff are notified when new complaints are reported or when issues require immediate attention. This feature ensures timely communication, improves transparency, and enhances the overall efficiency of the complaint resolution process. 

4 

## **4. ER Diagram** 

Figure 1 illustrates the Entity-Relationship (ER) diagram of the **Nogor Shomadhan** system. It represents the entities, attributes, and relationships among users, complaints, comments, categories, and other components of the platform. 

Figure 1: Entity-Relationship (ER) Diagram of the Nogor Shomadhan System 

5 

## **5. Tentative UI Pages** 

The following UI pages are planned for the Nogor Shomadhan system. Since the project is still under development, the list is tentative and may be refined during implementation. 

## **5.1 Public Pages** 

1. **Homepage:** Introduces Nogor Shomadhan as a smart community complaint management system. It shows the basic workflow, platform purpose, community progress overview and navigation options for login and registration. 

2. **About Page:** Describes the mission, purpose, target users and commitment of the platform. It explains how residents, admins, and community authorities are connected through the system. 

3. **Impact Page:** Highlights the expected impact of the platform, such as transparency, faster complaint handling, resident participation and data-driven urban management. 

4. **Contact Page:** Allows users to submit messages or queries to the platform through a contact form. 

5. **Sign In Page:** Allows users to log in by selecting their role, such as resident, community authority or admin. 

6. **Citizen Registration Page:** Allows new residents to create an account by providing personal details, NID, contact information, address, email, username and password. 

## **5.2 ResidentCitizen/User Module** 

1. **Resident Dashboard:** Shows a summary of the resident’s complaint activity, including total complaints, pending complaints, in-progress complaints, resolved complaints, recent complaints and map preview. 

2. **Create Complaint Page:** Allows residents to submit new complaints with complaint title, category, description, location, map information and evidence image. 

6 

3. **My Complaints Page:** Displays complaints submitted by the logged-in resident with status filters such as pending, in-progress and resolved. 

4. **Complaint Details Page:** Shows full complaint information, including description, category, location, attached evidence, urgency, current status, work updates and resolution details. 

5. **All Complaints Page:** Allows residents to view public complaints submitted by other users, helping them stay informed about community issues. 

6. **Feedback Section:** Allows residents to provide feedback and ratings after a complaint has been resolved. 

7. **Resident Analytics Page:** Shows complaint statistics for the residents, including submitted complaints, status-wise progress, category-wise data and complaint trends. 

8. **Profile Page:** Displays and manages resident profile information, account details, password change option and complaint activity summary. 

## **5.3 Community Authority Module** 

1. **Community Authority Dashboard:** Shows assigned complaint statistics, including total complaints, pending complaints, in-progress complaints, resolved complaints, recent complaints and map preview. 

2. **Pending Complaint Details Page:** Shows details of complaints waiting to be handled. The community authority can review complaint information, check evidence, view location and start work by adding deadline and work notes. 

3. **In-Progress Complaint Details Page:** Allows the community authority to update work progress, modify deadline, add notes and mark the complaint as resolved. 

4. **Resolved Complaint Details Page:** Shows completed complaints in read-only format, including final deadline, evidence, and resolution information. 

5. **Feedback Center Page:** Displays resident feedback and ratings for resolved complaints handled by the community authority. 

7 

6. **Community Authority Analytics Page:** Shows zone-wise and date-wise complaint statistics, status distribution, resolution performance, weekly trends, top categories and urgency hotspots. 

## **5.4 Admin Module** 

1. **Admin Dashboard:** Provides the main admin interface with access to account verification, registered accounts, complaint verification, all complaints, analytics and logout. 

2. **Pending Accounts Page:** Displays newly registered resident accounts waiting for admin approval. Admin can search, view, accept or reject accounts. 

3. **Registered Accounts Page:** Displays verified citizen accounts. Admin can search accounts, view details and delete accounts if necessary. 

4. **Unverified Complaints Page:** Shows newly submitted complaints waiting for admin verification before being forwarded to community authorities. 

5. **Complaint Verification Details Page:** Allows admin to review complaint title, category, description, location, evidence image and urgency before approving or rejecting the complaint. 

6. **Verified Complaints Page:** Displays complaints that have been approved by admin and forwarded for further action. 

7. **All Complaints Page:** Shows all complaints in the system, including pending, verified, rejected, in-progress and resolved complaints. 

8. **Complaint Report Page:** Allows admin to view or download complaint reports containing complaint details, map location and attached evidence. 

9. **Admin Analytics Page:** Shows overall platform statistics, including account status, complaint status, category-wise complaints and resolution progress. 

8 

## **6. Tentative APIs** 

## **6.1 Authentication APIs** 

1. **POST** `/auth/register/resident` **:** Registers a new resident account with personal, contact, location and login information. 

2. **POST** `/auth/login` **:** Authenticates users based on selected role, email/username, and password. 

3. **POST** `/auth/logout` **:** Logs out the current user and ends the session securely. 

4. **PATCH** `/auth/password` **:** Allows a logged-in user to change their account password. 

## **6.2 Public APIs** 

1. **GET** `/home/stats` **:** Fetches homepage statistics such as total complaints, resolved complaints, average resolution rate and complaints in progress. 

2. **GET** `/about` **:** Fetches platform information, mission, target users and commitment details. 

3. **GET** `/impact` **:** Fetches impact-related content, platform values and media coverage information. 

4. **POST** `/contact` **:** Submits contact form data such as name, contact number, email, subject and message. 

## **6.3 Resident/User APIs** 

1. **GET** `/resident/dashboard` **:** Fetches resident dashboard data, including complaint counts, recent complaints and map preview data. 

2. **GET** `/complaint-categories` **:** Fetches available complaint categories for complaint submission. 

3. **POST** `/resident/complaints` **:** Submits a new complaint with title, category, description, location, map coordinates and evidence image. 

9 

4. **GET** `/resident/complaints` **:** Fetches complaints submitted by the logged-in citizen with filtering options such as status, category, area and search keyword. 

5. **GET** `/resident/complaints/:complaintId` **:** Fetches full details of a selected complaint submitted by the resident. 

6. **GET** `/complaints` **:** Fetches all public complaints available in the system. 

7. **GET** `/complaints/:complaintId` **:** Fetches details of a public complaint, including status, location, urgency and progress information. 

8. **GET** `/complaints/:complaintId/location` **:** Fetches map coordinates or location data of a selected complaint. 

9. **POST** `/resident/complaints/:complaintId/feedback` **:** Submits resident feedback and rating for a resolved complaint. 

10. **GET** `/resident/analytics` **:** Fetches resident-specific complaint statistics and trends. 

11. **GET** `/resident/profile` **:** Fetches the logged-in citizen’s profile information. 

12. **PATCH** `/resident/profile` **:** Updates resident profile information such as name, phone number, email or address. 

## **6.4 Community Authority APIs** 

1. **GET** `/authority/dashboard` **:** Fetches community authority dashboard data, including assigned complaint counts, recent complaints and map data. 

2. **GET** `/authority/complaints` **:** Fetches all complaints assigned to the community authority with filters such as status, category, area and search keyword. 

3. **GET** `/authority/complaints/:complaintId` **:** Fetches full details of a selected assigned complaint. 

4. **PATCH** `/authority/complaints/:complaintId/start` **:** Changes a pending complaint status to in-progress and stores initial work details such as deadline, budget and work note. 

10 

5. **PATCH** `/authority/complaints/:complaintId/work-plan` **:** Updates the work plan of an in-progress complaint, including deadline, budget and progress note. 

6. **PATCH** `/authority/complaints/:complaintId/resolve` **:** Marks an in-progress complaint as resolved after completion of work. 

7. **GET** `/authority/feedback` **:** Fetches citizen feedback and ratings for complaints handled by the local authority. 

8. **GET** `/authority/analytics` **:** Fetches analytics data based on zone and date range, including complaint status, resolution rate, top categories and urgency hotspots. 

## **6.5 Admin APIs** 

1. **GET** `/admin/pending-accounts` **:** Fetches all newly registered resident accounts waiting for admin verification. 

2. **GET** `/admin/accounts/:accountId` **:** Fetches detailed information of a specific resident account. 

3. **PATCH** `/admin/accounts/:accountId/approve` **:** Approves and activates a pending resident account. 

4. **PATCH** `/admin/accounts/:accountId/reject` **:** Rejects a pending resident account if the information is invalid or suspicious. 

5. **GET** `/admin/registered-accounts` **:** Fetches all verified resident accounts. 

6. **DELETE** `/admin/accounts/:accountId` **:** Deletes a registered resident account from the system when necessary. 

7. **GET** `/admin/unverified-complaints` **:** Fetches all complaints waiting for admin verification. 

8. **GET** `/admin/complaints/:complaintId` **:** Fetches full details of a selected complaint for admin review. 

9. **PATCH** `/admin/complaints/:complaintId/approve` **:** Approves a complaint after admin verification and forwards it for authority action. 

11 

10. **PATCH** `/admin/complaints/:complaintId/reject` **:** Rejects a complaint if it is invalid, incomplete, fake or unsuitable. 

11. **GET** `/admin/complaints/:complaintId/report` **:** Generates or fetches a complaint report with details, location and evidence. 

12. **GET** `/admin/complaints` **:** Fetches all complaints in the system with filtering options such as pending, verified, rejected, in-progress or resolved. 

13. **DELETE** `/admin/complaints/:complaintId` **:** Deletes a complaint from the system when required. 

14. **GET** `/admin/analytics` **:** Fetches overall system analytics, including complaint statistics, account statistics, category-wise reports and resolution progress. 

12 

## **7. App Review** 

This section reviews existing citizen reporting applications that provide services similar to the proposed **Nogor Shomadhan** platform. The table highlights the major features offered by each application along with their limitations, thereby identifying the gaps that Nogor Shomadhan aims to address. 

Table 1: Review of Existing Citizen Reporting Applications 

|**Application**|**Key Features**|**Limitations**|
|---|---|---|
|**FixMyStreet**|• GPS-based issue reporting<br>• Photo upload<br>• Interactive map<br>• Complaint status tracking<br>• Direct reporting to local au-<br>thorities|• No AI-based complaint catego-<br>rization<br>• No duplicate complaint detec-<br>tion<br>• No urgency voting feature|
|**SeeClickFix**|• GPS location support<br>• Image upload<br>• Interactive map<br>• Status tracking<br>• Comments and notifcations<br>• Authority dashboard|• No AI-powered issue catego-<br>rization<br>• No duplicate complaint detec-<br>tion<br>• Limited analytics for authori-<br>ties|



13 

|**Application**|**Key Features**|**Limitations**|
|---|---|---|
|**CitySourced**|• GPS-enabled issue reporting<br>• Photo and video upload<br>• Interactive map view<br>• Real-time complaint tracking<br>• Two-way communication be-<br>tween citizens and authorities|• No AI-based complaint catego-<br>rization<br>• No duplicate complaint detec-<br>tion<br>• No citizen urgency voting sys-<br>tem<br>• Limited data analytics and vi-<br>sualization|
|**311**<br>**Mobile**<br>**(City**<br>**311**<br>**Apps)**|• Report non-emergency civic is-<br>sues<br>• GPS location tagging<br>• Image attachment support<br>• Complaint status updates<br>• Service request history<br>• Authority management dash-<br>board|• Features vary between cities<br>• No AI-powered issue catego-<br>rization<br>• No duplicate complaint detec-<br>tion<br>• Limited public engagement fea-<br>tures such as voting or commu-<br>nity discussions|



14 

## **8. Contribution Table** 

|**Member**|**Name**|**Contribution**|
|---|---|---|
|1|AKM Zawadur Rafd|App Review:<br>FixMyStreet, Fi-<br>nalized features, ER Diagram|
|2|Ashfa Tabassum|App Review: CitySourced, Ten-<br>tative APIs|
|3|Nanjiba Ibnat Farazi|App Review: SeeClickFix, Tenta-<br>tive UI pages|
|4|Savera Momtaj Bhuiyan|App Review: 311 Mobile, Project<br>Objectives, Problem Statement|



15 

