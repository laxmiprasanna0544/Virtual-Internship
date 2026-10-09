
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": NonNullable<Json>,"id": string,"target_id": string,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"target_id": string,"target_type": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"assessment_attempts": {
                  Row: {
                    "answers": NonNullable<Json>,"assessment_id": string,"domain_id": string,"id": string,"kind": string,"overridden_by": string | null,"passed": boolean,"percentage": number,"score": number,"student_id": string,"submitted_at": string,"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"assessment_id": string,"domain_id": string,"id"?: string,"kind": string,"overridden_by"?: string | null,"passed": boolean,"percentage": number,"score": number,"student_id": string,"submitted_at"?: string,"total": number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"assessment_id"?: string,"domain_id"?: string,"id"?: string,"kind"?: string,"overridden_by"?: string | null,"passed"?: boolean,"percentage"?: number,"score"?: number,"student_id"?: string,"submitted_at"?: string,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "assessment_attempts_overridden_by_fkey"
      columns: ["overridden_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assessment_attempts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"career_passports": {
                  Row: {
                    "about": string,"created_at": string,"headline": string,"published": boolean,"slug": string,"student_id": string,"updated_at": string,"visibility": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "about"?: string,"created_at"?: string,"headline"?: string,"published"?: boolean,"slug": string,"student_id": string,"updated_at"?: string,"visibility"?: NonNullable<Json>
                  }
                  Update: {
                    "about"?: string,"created_at"?: string,"headline"?: string,"published"?: boolean,"slug"?: string,"student_id"?: string,"updated_at"?: string,"visibility"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "career_passports_student_id_fkey"
      columns: ["student_id"]
isOneToOne: true
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"certificates": {
                  Row: {
                    "created_at": string,"domain_id": string,"domain_name": string,"duration": string,"final_score": number,"id": string,"issue_date": string,"program_id": Database["public"]['Enums']["program_id"],"program_name": string,"registration_id": string,"revoked_at": string | null,"revoked_reason": string | null,"status": Database["public"]['Enums']["certificate_status"],"student_id": string,"student_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"domain_id": string,"domain_name": string,"duration": string,"final_score": number,"id": string,"issue_date"?: string,"program_id": Database["public"]['Enums']["program_id"],"program_name": string,"registration_id": string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"status"?: Database["public"]['Enums']["certificate_status"],"student_id": string,"student_name": string
                  }
                  Update: {
                    "created_at"?: string,"domain_id"?: string,"domain_name"?: string,"duration"?: string,"final_score"?: number,"id"?: string,"issue_date"?: string,"program_id"?: Database["public"]['Enums']["program_id"],"program_name"?: string,"registration_id"?: string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"status"?: Database["public"]['Enums']["certificate_status"],"student_id"?: string,"student_name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificates_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: true
      referencedRelation: "registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"challenge_entries": {
                  Row: {
                    "approach": string,"challenge_id": string,"evaluated_at": string | null,"feedback": string | null,"id": string,"repo_url": string | null,"score": number | null,"solution": string,"status": string,"student_id": string,"submitted_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "approach"?: string,"challenge_id": string,"evaluated_at"?: string | null,"feedback"?: string | null,"id"?: string,"repo_url"?: string | null,"score"?: number | null,"solution"?: string,"status"?: string,"student_id": string,"submitted_at"?: string | null
                  }
                  Update: {
                    "approach"?: string,"challenge_id"?: string,"evaluated_at"?: string | null,"feedback"?: string | null,"id"?: string,"repo_url"?: string | null,"score"?: number | null,"solution"?: string,"status"?: string,"student_id"?: string,"submitted_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_entries_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"college_leads": {
                  Row: {
                    "city": string,"college_name": string,"contact_person": string,"created_at": string,"departments": string,"designation": string,"email": string,"id": string,"institution_type": Database["public"]['Enums']["institution_type"] | null,"interest": string,"message": string,"phone": string,"state": string,"status": string,"student_count": string,"year_batch": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string,"college_name": string,"contact_person": string,"created_at"?: string,"departments"?: string,"designation"?: string,"email": string,"id"?: string,"institution_type"?: Database["public"]['Enums']["institution_type"] | null,"interest"?: string,"message"?: string,"phone"?: string,"state"?: string,"status"?: string,"student_count"?: string,"year_batch"?: string
                  }
                  Update: {
                    "city"?: string,"college_name"?: string,"contact_person"?: string,"created_at"?: string,"departments"?: string,"designation"?: string,"email"?: string,"id"?: string,"institution_type"?: Database["public"]['Enums']["institution_type"] | null,"interest"?: string,"message"?: string,"phone"?: string,"state"?: string,"status"?: string,"student_count"?: string,"year_batch"?: string
                  }
                  Relationships: [
                    
                  ]
                },"colleges": {
                  Row: {
                    "active": boolean,"city": string,"contact_email": string,"contact_person": string,"created_at": string,"departments": (string)[],"designation": string,"id": string,"name": string,"phone": string,"state": string,"type": Database["public"]['Enums']["institution_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"city"?: string,"contact_email"?: string,"contact_person"?: string,"created_at"?: string,"departments"?: (string)[],"designation"?: string,"id": string,"name": string,"phone"?: string,"state"?: string,"type": Database["public"]['Enums']["institution_type"]
                  }
                  Update: {
                    "active"?: boolean,"city"?: string,"contact_email"?: string,"contact_person"?: string,"created_at"?: string,"departments"?: (string)[],"designation"?: string,"id"?: string,"name"?: string,"phone"?: string,"state"?: string,"type"?: Database["public"]['Enums']["institution_type"]
                  }
                  Relationships: [
                    
                  ]
                },"communication_logs": {
                  Row: {
                    "body": string,"channel": string,"created_at": string,"event": string,"id": string,"provider_message_id": string | null,"recipient": string,"status": string,"subject": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"channel": string,"created_at"?: string,"event": string,"id"?: string,"provider_message_id"?: string | null,"recipient": string,"status"?: string,"subject"?: string
                  }
                  Update: {
                    "body"?: string,"channel"?: string,"created_at"?: string,"event"?: string,"id"?: string,"provider_message_id"?: string | null,"recipient"?: string,"status"?: string,"subject"?: string
                  }
                  Relationships: [
                    
                  ]
                },"earned_badges": {
                  Row: {
                    "badge_id": string,"earned_at": string,"evidence": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "badge_id": string,"earned_at"?: string,"evidence"?: string,"student_id": string
                  }
                  Update: {
                    "badge_id"?: string,"earned_at"?: string,"evidence"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "earned_badges_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"fellowship_applications": {
                  Row: {
                    "applied_at": string | null,"available_from": string | null,"can_relocate": boolean,"id": string,"motivation": string,"preferred_area": string,"readiness_at_apply": number,"stage": string,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_at"?: string | null,"available_from"?: string | null,"can_relocate"?: boolean,"id"?: string,"motivation"?: string,"preferred_area"?: string,"readiness_at_apply"?: number,"stage"?: string,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "applied_at"?: string | null,"available_from"?: string | null,"can_relocate"?: boolean,"id"?: string,"motivation"?: string,"preferred_area"?: string,"readiness_at_apply"?: number,"stage"?: string,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fellowship_applications_student_id_fkey"
      columns: ["student_id"]
isOneToOne: true
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"interview_sessions": {
                  Row: {
                    "answers": NonNullable<Json>,"completed_at": string,"domain_id": string,"id": string,"improvements": (string)[],"kind": string,"overall_score": number,"scores": NonNullable<Json>,"strengths": (string)[],"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"completed_at"?: string,"domain_id": string,"id"?: string,"improvements"?: (string)[],"kind": string,"overall_score"?: number,"scores"?: NonNullable<Json>,"strengths"?: (string)[],"student_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"completed_at"?: string,"domain_id"?: string,"id"?: string,"improvements"?: (string)[],"kind"?: string,"overall_score"?: number,"scores"?: NonNullable<Json>,"strengths"?: (string)[],"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "interview_sessions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"linkedin_drafts": {
                  Row: {
                    "sections": NonNullable<Json>,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "sections"?: NonNullable<Json>,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "sections"?: NonNullable<Json>,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "linkedin_drafts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: true
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"module_progress": {
                  Row: {
                    "completed_modules": (string)[],"domain_id": string,"last_module_id": string | null,"notes": NonNullable<Json>,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_modules"?: (string)[],"domain_id": string,"last_module_id"?: string | null,"notes"?: NonNullable<Json>,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "completed_modules"?: (string)[],"domain_id"?: string,"last_module_id"?: string | null,"notes"?: NonNullable<Json>,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "module_progress_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string,"created_at": string,"href": string | null,"id": string,"read": boolean,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"href"?: string | null,"id"?: string,"read"?: boolean,"title": string,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"href"?: string | null,"id"?: string,"read"?: boolean,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_paise": number,"created_at": string,"currency": string,"id": string,"method": Database["public"]['Enums']["payment_method"] | null,"provider": string,"provider_order_id": string,"provider_payload": Json | null,"provider_payment_id": string | null,"registration_id": string | null,"status": Database["public"]['Enums']["payment_status"],"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"created_at"?: string,"currency"?: string,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"] | null,"provider"?: string,"provider_order_id": string,"provider_payload"?: Json | null,"provider_payment_id"?: string | null,"registration_id"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"created_at"?: string,"currency"?: string,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"] | null,"provider"?: string,"provider_order_id"?: string,"provider_payload"?: Json | null,"provider_payment_id"?: string | null,"registration_id"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: false
      referencedRelation: "registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_color": string,"college_id": string | null,"created_at": string,"email": string,"full_name": string,"id": string,"legacy_demo_id": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_color"?: string,"college_id"?: string | null,"created_at"?: string,"email": string,"full_name"?: string,"id": string,"legacy_demo_id"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_color"?: string,"college_id"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"legacy_demo_id"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_college_id_fkey"
      columns: ["college_id"]
isOneToOne: false
      referencedRelation: "colleges"
      referencedColumns: ["id"]
    }
                  ]
                },"project_submissions": {
                  Row: {
                    "analysis": string,"criterion_scores": NonNullable<Json>,"domain_id": string,"evaluated_at": string | null,"feedback": string | null,"id": string,"overall_score": number | null,"project_id": string,"recommendations": string,"repo_url": string | null,"report_file_name": string | null,"report_file_path": string | null,"started_at": string | null,"status": string,"student_id": string,"submitted_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "analysis"?: string,"criterion_scores"?: NonNullable<Json>,"domain_id": string,"evaluated_at"?: string | null,"feedback"?: string | null,"id"?: string,"overall_score"?: number | null,"project_id": string,"recommendations"?: string,"repo_url"?: string | null,"report_file_name"?: string | null,"report_file_path"?: string | null,"started_at"?: string | null,"status"?: string,"student_id": string,"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "analysis"?: string,"criterion_scores"?: NonNullable<Json>,"domain_id"?: string,"evaluated_at"?: string | null,"feedback"?: string | null,"id"?: string,"overall_score"?: number | null,"project_id"?: string,"recommendations"?: string,"repo_url"?: string | null,"report_file_name"?: string | null,"report_file_path"?: string | null,"started_at"?: string | null,"status"?: string,"student_id"?: string,"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_submissions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"registrations": {
                  Row: {
                    "amount_paise": number,"created_at": string,"domain_id": string,"experience": Database["public"]['Enums']["experience_level"],"id": string,"internship_status": Database["public"]['Enums']["internship_status"],"payment_status": Database["public"]['Enums']["payment_status"],"program_id": Database["public"]['Enums']["program_id"],"start_date": string | null,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"created_at"?: string,"domain_id": string,"experience": Database["public"]['Enums']["experience_level"],"id": string,"internship_status"?: Database["public"]['Enums']["internship_status"],"payment_status"?: Database["public"]['Enums']["payment_status"],"program_id": Database["public"]['Enums']["program_id"],"start_date"?: string | null,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"created_at"?: string,"domain_id"?: string,"experience"?: Database["public"]['Enums']["experience_level"],"id"?: string,"internship_status"?: Database["public"]['Enums']["internship_status"],"payment_status"?: Database["public"]['Enums']["payment_status"],"program_id"?: Database["public"]['Enums']["program_id"],"start_date"?: string | null,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "registrations_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"resume_drafts": {
                  Row: {
                    "headline": string,"include_assessments": boolean,"include_certificate": boolean,"include_projects": boolean,"skills": (string)[],"student_id": string,"summary": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "headline"?: string,"include_assessments"?: boolean,"include_certificate"?: boolean,"include_projects"?: boolean,"skills"?: (string)[],"student_id": string,"summary"?: string,"updated_at"?: string
                  }
                  Update: {
                    "headline"?: string,"include_assessments"?: boolean,"include_certificate"?: boolean,"include_projects"?: boolean,"skills"?: (string)[],"student_id"?: string,"summary"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resume_drafts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: true
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"scholarship_applications": {
                  Row: {
                    "awarded_tier": number | null,"category": string,"created_at": string,"decided_at": string | null,"household_income_band": string,"id": string,"requested_tier": number,"statement": string,"status": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_tier"?: number | null,"category"?: string,"created_at"?: string,"decided_at"?: string | null,"household_income_band"?: string,"id"?: string,"requested_tier": number,"statement"?: string,"status"?: string,"student_id": string
                  }
                  Update: {
                    "awarded_tier"?: number | null,"category"?: string,"created_at"?: string,"decided_at"?: string | null,"household_income_band"?: string,"id"?: string,"requested_tier"?: number,"statement"?: string,"status"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "scholarship_applications_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"students": {
                  Row: {
                    "active_registration_id": string | null,"city": string,"college": string,"course": string,"created_at": string,"domain_id": string | null,"education_level": Database["public"]['Enums']["education_level"],"enrolled_at": string | null,"experience": Database["public"]['Enums']["experience_level"] | null,"id": string,"mobile": string,"program_id": Database["public"]['Enums']["program_id"] | null,"status": Database["public"]['Enums']["student_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_registration_id"?: string | null,"city"?: string,"college"?: string,"course"?: string,"created_at"?: string,"domain_id"?: string | null,"education_level"?: Database["public"]['Enums']["education_level"],"enrolled_at"?: string | null,"experience"?: Database["public"]['Enums']["experience_level"] | null,"id": string,"mobile"?: string,"program_id"?: Database["public"]['Enums']["program_id"] | null,"status"?: Database["public"]['Enums']["student_status"],"updated_at"?: string
                  }
                  Update: {
                    "active_registration_id"?: string | null,"city"?: string,"college"?: string,"course"?: string,"created_at"?: string,"domain_id"?: string | null,"education_level"?: Database["public"]['Enums']["education_level"],"enrolled_at"?: string | null,"experience"?: Database["public"]['Enums']["experience_level"] | null,"id"?: string,"mobile"?: string,"program_id"?: Database["public"]['Enums']["program_id"] | null,"status"?: Database["public"]['Enums']["student_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "students_active_registration_fkey"
      columns: ["active_registration_id"]
isOneToOne: false
      referencedRelation: "registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "students_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"submissions": {
                  Row: {
                    "created_at": string,"domain_id": string,"feedback": string | null,"file_name": string | null,"file_path": string | null,"id": string,"response_text": string,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["submission_status"],"student_id": string,"submitted_at": string | null,"task_title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"domain_id": string,"feedback"?: string | null,"file_name"?: string | null,"file_path"?: string | null,"id"?: string,"response_text"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["submission_status"],"student_id": string,"submitted_at"?: string | null,"task_title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"domain_id"?: string,"feedback"?: string | null,"file_name"?: string | null,"file_path"?: string | null,"id"?: string,"response_text"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["submission_status"],"student_id"?: string,"submitted_at"?: string | null,"task_title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"trainers": {
                  Row: {
                    "accent": string,"active": boolean,"bio": string,"created_at": string,"domains": (string)[],"experience": string,"id": string,"industry": string,"initials": string,"linkedin": string,"name": string,"profile_id": string | null,"specialization": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accent"?: string,"active"?: boolean,"bio"?: string,"created_at"?: string,"domains"?: (string)[],"experience"?: string,"id": string,"industry"?: string,"initials"?: string,"linkedin"?: string,"name": string,"profile_id"?: string | null,"specialization"?: string,"title"?: string,"updated_at"?: string
                  }
                  Update: {
                    "accent"?: string,"active"?: boolean,"bio"?: string,"created_at"?: string,"domains"?: (string)[],"experience"?: string,"id"?: string,"industry"?: string,"initials"?: string,"linkedin"?: string,"name"?: string,"profile_id"?: string | null,"specialization"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trainers_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_see_student":
{ Args: { "target": string }; Returns: boolean
                           },
"create_paid_registration":
{ Args: { "p_amount_paise": number,"p_domain_code": string,"p_domain_id": string,"p_experience": Database["public"]['Enums']["experience_level"],"p_method": Database["public"]['Enums']["payment_method"],"p_program_id": Database["public"]['Enums']["program_id"],"p_provider": string,"p_provider_order_id": string,"p_provider_payload"?: Json,"p_provider_payment_id"?: string,"p_student_id": string }; Returns: {
              "amount_paise": number,
"created_at": string,
"domain_id": string,
"experience": Database["public"]['Enums']["experience_level"],
"id": string,
"internship_status": Database["public"]['Enums']["internship_status"],
"payment_status": Database["public"]['Enums']["payment_status"],
"program_id": Database["public"]['Enums']["program_id"],
"start_date": string | null,
"student_id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "registrations"
        isOneToOne: true
        isSetofReturn: false
      } },
"current_app_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"current_college_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_trainer_domains":
{ Args: Record<PropertyKey, never>; Returns: (string)[]
                           },
"has_paid_for_domain":
{ Args: { "target_domain": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"issue_certificate":
{ Args: { "p_domain_code": string,"p_domain_name": string,"p_duration": string,"p_final_score": number,"p_program_name": string,"p_registration_id": string,"p_student_id": string,"p_student_name": string }; Returns: {
              "created_at": string,
"domain_id": string,
"domain_name": string,
"duration": string,
"final_score": number,
"id": string,
"issue_date": string,
"program_id": Database["public"]['Enums']["program_id"],
"program_name": string,
"registration_id": string,
"revoked_at": string | null,
"revoked_reason": string | null,
"status": Database["public"]['Enums']["certificate_status"],
"student_id": string,
"student_name": string
            }
                          SetofOptions: {
        from: "*"
        to: "certificates"
        isOneToOne: true
        isSetofReturn: false
      } },
"save_module_note":
{ Args: { "note": string,"target_domain": string,"target_module": string }; Returns: undefined
                           },
"set_module_complete":
{ Args: { "complete": boolean,"target_domain": string,"target_module": string }; Returns: (string)[]
                           },
"switch_active_domain":
{ Args: { "target_domain": string }; Returns: boolean
                           },
"verify_certificate":
{ Args: { "certificate_id": string }; Returns: {
              "domain_id": string,"domain_name": string,"duration": string,"id": string,"issue_date": string,"program_id": Database["public"]['Enums']["program_id"],"program_name": string,"status": Database["public"]['Enums']["certificate_status"],"student_name": string
            }[]
                           }
          }
          Enums: {
            "app_role": "student"|"admin"|"trainer"|"college"|"partner","certificate_status": "valid"|"revoked","education_level": "intermediate"|"diploma"|"undergraduate"|"postgraduate"|"working-professional","experience_level": "beginner"|"intermediate"|"advanced","institution_type": "engineering"|"degree"|"university"|"training","internship_status": "not-started"|"in-progress"|"completed"|"certified","payment_method": "upi"|"card"|"netbanking","payment_status": "successful"|"pending"|"failed"|"refunded","program_id": "self-paced"|"industry-led","student_status": "active"|"suspended"|"completed","submission_status": "pending"|"submitted"|"reviewed"|"approved"|"needs-revision"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["student", "admin", "trainer", "college", "partner"],"certificate_status": ["valid", "revoked"],"education_level": ["intermediate", "diploma", "undergraduate", "postgraduate", "working-professional"],"experience_level": ["beginner", "intermediate", "advanced"],"institution_type": ["engineering", "degree", "university", "training"],"internship_status": ["not-started", "in-progress", "completed", "certified"],"payment_method": ["upi", "card", "netbanking"],"payment_status": ["successful", "pending", "failed", "refunded"],"program_id": ["self-paced", "industry-led"],"student_status": ["active", "suspended", "completed"],"submission_status": ["pending", "submitted", "reviewed", "approved", "needs-revision"]
          }
        }
} as const
