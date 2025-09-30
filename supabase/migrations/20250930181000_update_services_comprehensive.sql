-- Clear existing services and insert the comprehensive service breakdown
DELETE FROM services;

-- Insert the comprehensive services
INSERT INTO services (category_id, name, description) VALUES
  -- Traditional Case Preparation & Litigation Services
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Perusal and Consideration', 'Analyzing all case-related documents (pleadings, evidence, discovery).'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Legal Research', 'Investigating statutes, case law, and legal principles.'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Factual Investigation and Strategy', 'Analyzing facts and formulating the legal strategy.'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Drafting & Written Work', 'Creating pleadings, heads of argument, legal opinions, affidavits, notices, and settlement agreements.'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Appearances & Oral Advocacy', 'Representing clients in court, tribunals, arbitrations, mediations, pre-trial conferences, and at inspections.'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Consultations & Meetings', 'Meeting with attorneys, clients, and witnesses.'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Negotiation & Settlement', 'Engaging with opposing parties to resolve disputes.'),
  ((SELECT id FROM service_categories WHERE name = 'Traditional Case Preparation & Litigation Services'), 'Travel & Waiting Time', 'Time spent travelling for a case or waiting at court.'),
  
  -- Technology-Enabled Legal Services
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'eDiscovery Strategy Development', 'Developing the eDiscovery strategy.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'eDiscovery Vendor Management', 'Managing eDiscovery vendors.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Data Processing Workflow Design', 'Designing data processing and review workflows.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Technology-Assisted Review Management', 'Managing the use of advanced analytics like Technology-Assisted Review (TAR).'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Document Review Team Oversight', 'Overseeing the document review team and managing quality control.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Digital Forensic Investigation Scoping', 'Scoping the investigation with forensic experts.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Forensic Evidence Admissibility', 'Ensuring the forensic soundness and admissibility of evidence.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Forensic Expert Team Management', 'Managing the expert team and budget.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Technical Legal Narrative Development', 'Translating technical forensic findings into a legal narrative.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Forensic Expert Testimony Preparation', 'Preparing forensic experts for testimony.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Legal Technology Assessment', 'Assessing and recommending case-specific technology tools.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Practice Technology Strategy', 'Advising law firms on practice-area technology strategy.'),
  ((SELECT id FROM service_categories WHERE name = 'Technology-Enabled Legal Services'), 'Client Technology Implementation', 'Assisting clients with selecting and implementing legal technology.'),
  
  -- Advanced Case & Risk Management Services
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Legal Project Scoping & Planning', 'Formal scoping, planning, and scheduling of a legal matter.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Work Breakdown Structure Creation', 'Creating a Work Breakdown Structure and timeline.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Legal Matter Budgeting', 'Budgeting and resource planning.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Formal Risk Management', 'Conducting formal risk management and maintaining a risk register.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Client Progress Reporting', 'Providing structured progress and budget reporting to the client.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Multi-Phase Litigation Budgeting', 'Developing detailed, multi-phase litigation budgets.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Budget Assumptions Documentation', 'Defining and documenting budget assumptions.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Litigation Scenario Analysis', 'Conducting scenario analysis (e.g., cost of trial vs. settlement).'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Budget Tracking & Forecasting', 'Tracking actual spend against the budget and re-forecasting.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Third-Party Funding Advisory', 'Advising on third-party litigation funding options.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Legal-Media Strategy Development', 'Developing a legal-media strategy for high-profile cases.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Press Release & Communications', 'Drafting or vetting press releases and stakeholder communications.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Media Liaison Services', 'Acting as a media liaison or briefing the client''s spokesperson.'),
  ((SELECT id FROM service_categories WHERE name = 'Advanced Case & Risk Management Services'), 'Reputational Risk Management', 'Managing reputational risk arising from litigation.'),
  
  -- Proactive Advisory & Compliance Services
  ((SELECT id FROM service_categories WHERE name = 'Proactive Advisory & Compliance Services'), 'FICA Risk Management Programme Development', 'Developing and reviewing FICA Risk Management and Compliance Programmes (RMCPs).'),
  ((SELECT id FROM service_categories WHERE name = 'Proactive Advisory & Compliance Services'), 'POPIA Compliance Advisory', 'Advising on POPIA compliance, including drafting privacy policies and training Information Officers.'),
  ((SELECT id FROM service_categories WHERE name = 'Proactive Advisory & Compliance Services'), 'Corporate Governance Advisory', 'Advising on Companies Act and King IV corporate governance duties, especially for Social and Ethics Committees.'),
  ((SELECT id FROM service_categories WHERE name = 'Proactive Advisory & Compliance Services'), 'Commercial Risk Audits', 'Conducting general commercial risk audits of contracts and policies.'),
  ((SELECT id FROM service_categories WHERE name = 'Proactive Advisory & Compliance Services'), 'EHS Compliance Audits', 'Performing specialised audits for compliance with environmental, health, and safety (EHS) legislation.'),
  ((SELECT id FROM service_categories WHERE name = 'Proactive Advisory & Compliance Services'), 'Trust Account Audit Preparation', 'Advising law firms on preparing their systems for the annual Attorneys'' Trust Account audit.'),
  
  -- Expanded Neutral & Adjudicative Roles
  ((SELECT id FROM service_categories WHERE name = 'Expanded Neutral & Adjudicative Roles'), 'Professional Arbitration Services', 'Acting as a neutral arbitrator to hear evidence and issue a binding award.'),
  ((SELECT id FROM service_categories WHERE name = 'Expanded Neutral & Adjudicative Roles'), 'Professional Mediation Services', 'Acting as a neutral mediator to facilitate settlement negotiations between parties.'),
  ((SELECT id FROM service_categories WHERE name = 'Expanded Neutral & Adjudicative Roles'), 'Disciplinary Hearing Chair', 'Presiding over internal corporate disciplinary or grievance hearings.'),
  ((SELECT id FROM service_categories WHERE name = 'Expanded Neutral & Adjudicative Roles'), 'Appeal Hearing Chair', 'Chairing internal appeal hearings.'),
  ((SELECT id FROM service_categories WHERE name = 'Expanded Neutral & Adjudicative Roles'), 'Independent Investigation Conduct', 'Conducting independent internal investigations into workplace misconduct (e.g., fraud, harassment).'),
  
  -- Knowledge Transfer & Educational Services
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Legal Training Needs Analysis', 'Conducting a needs analysis and designing a custom training curriculum for a client.'),
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Bespoke Course Material Development', 'Developing bespoke course materials, case studies, and templates.'),
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Specialist Legal Training Delivery', 'Delivering tailored workshops or webinars on specialist legal topics for law firms or corporate teams.'),
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Compliance Manual Development', 'Drafting chapters for corporate compliance manuals.'),
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Legal Playbook Creation', 'Developing legal "playbooks" or practical guides for in-house teams.'),
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Template Library Development', 'Creating annotated legal template libraries for a client''s use.'),
  ((SELECT id FROM service_categories WHERE name = 'Knowledge Transfer & Educational Services'), 'Legislative Update Service', 'Providing a retainer-based service to produce summaries of relevant legislative updates.');