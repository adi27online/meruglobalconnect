// src/app/jobs-careers/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout'; // Assuming you have a Layout component
import styles from './jobsCareers.module.css'; // Keep your specific styles for the page

// --- INTERFACES (Matching Backend API Structures) ---

// Job Seeker Profile Interface (unchanged)
interface JobSeekerProfile {
  id: string;
  userId: string;
  fullName: string;
  location: string;
  contactEmail: string;
  phoneNumber?: string;
  education: Array<{
    degree: string;
    fieldOfStudy: string;
    institution: string;
    location?: string;
    graduationDate: string; // YYYY-MM
    description?: string;
  }>;
  experience: Array<{
    jobTitle: string;
    companyName: string;
    location?: string;
    employmentType?: string;
    startDate: string; // YYYY-MM
    endDate?: string; // YYYY-MM or undefined if current
    description: string;
  }>;
  skills: string[]; // Array of strings, e.g., ['Python', 'Project Management']
  resumeUrl?: string; // URL to the uploaded resume
  createdAt: string;
  updatedAt: string;
}

// Job Posting Interface (UPDATED: Added contactPersonName & contactPersonEmail)
interface JobPosting {
  id: string;
  employerId: string; // userId of the poster
  jobTitle: string;
  companyName: string;
  location: string; // e.g., 'Remote', 'New York, NY', 'Hybrid'
  jobDescription: string;
  responsibilities: string;
  qualifications: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  salaryRange?: string; // e.g., '$80,000 - $100,000'
  applicationInstructions: string;
  contactEmail: string; // General contact email for the job
  contactPersonName?: string; // NEW: Name of the direct contact person
  contactPersonEmail?: string; // NEW: Email of the direct contact person
  deadline?: string; // ISO date string
  createdAt: string;
  status: 'active' | 'closed';
}

export default function JobsCareersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // To check login status for forms

  // --- Job Seeker Profile Form States (UNCHANGED) ---
  const [seekerProfile, setSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [seekerLoading, setSeekerLoading] = useState(true);
  const [seekerError, setSeekerError] = useState<string | null>(null);

  const [seekerFormName, setSeekerFormName] = useState('');
  const [seekerFormLocation, setSeekerFormLocation] = useState('');
  const [seekerFormEmail, setSeekerFormEmail] = useState('');
  const [seekerFormPhone, setSeekerFormPhone] = useState('');
  const [seekerFormEducation, setSeekerFormEducation] = useState<JobSeekerProfile['education']>([]);
  const [seekerFormExperience, setSeekerFormExperience] = useState<JobSeekerProfile['experience']>([]);
  const [seekerFormSkills, setSeekerFormSkills] = useState<string[]>([]);
  const [seekerFormResumeFile, setSeekerFormResumeFile] = useState<File | null>(null);
  const [seekerFormLoading, setSeekerFormLoading] = useState(false);
  const [seekerFormError, setSeekerFormError] = useState<string | null>(null);
  const [seekerFormSuccess, setSeekerFormSuccess] = useState<string | null>(null);

  // --- Job Posting Form States (NEW) ---
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]); // For the list of all postings
  const [postingFormJobTitle, setPostingFormJobTitle] = useState('');
  const [postingFormCompanyName, setPostingFormCompanyName] = useState('');
  const [postingFormLocation, setPostingFormLocation] = useState('');
  const [postingFormJobDescription, setPostingFormJobDescription] = useState('');
  const [postingFormResponsibilities, setPostingFormResponsibilities] = useState('');
  const [postingFormQualifications, setPostingFormQualifications] = useState('');
  const [postingFormEmploymentType, setPostingFormEmploymentType] = useState<JobPosting['employmentType'] | ''>('');
  const [postingFormSalaryRange, setPostingFormSalaryRange] = useState('');
  const [postingFormApplicationInstructions, setPostingFormApplicationInstructions] = useState('');
  const [postingFormContactEmail, setPostingFormContactEmail] = useState('');
  const [postingFormContactPersonName, setPostingFormContactPersonName] = useState('');
  const [postingFormContactPersonEmail, setPostingFormContactPersonEmail] = useState('');
  const [postingFormDeadline, setPostingFormDeadline] = useState('');
  const [postingFormLoading, setPostingFormLoading] = useState(false);
  const [postingFormError, setPostingFormError] = useState<string | null>(null);
  const [postingFormSuccess, setPostingFormSuccess] = useState<string | null>(null);

  // --- Lists of Profiles/Postings ---
  const [allSeekerProfiles, setAllSeekerProfiles] = useState<JobSeekerProfile[]>([]);
  const [listProfilesLoading, setListProfilesLoading] = useState(true);
  const [listProfilesError, setListProfilesError] = useState<string | null>(null);

  const [allJobPostings, setAllJobPostings] = useState<JobPosting[]>([]);
  const [listPostingsLoading, setListPostingsLoading] = useState(true);
  const [listPostingsError, setListPostingsError] = useState<string | null>(null);


  // --- AUTH CHECK ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (!token) {
      // If not logged in, clear any existing data that might be lingering
      setSeekerProfile(null);
      setAllSeekerProfiles([]);
      setAllJobPostings([]);
    }
  }, []);

  // --- FETCH JOB SEEKER PROFILE (if logged in) (UNCHANGED) ---
  useEffect(() => {
    const fetchSeekerProfile = async () => {
      if (!isLoggedIn) {
        setSeekerLoading(false);
        return;
      }
      setSeekerLoading(true);
      setSeekerError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/job-seekers/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSeekerProfile(data.profile);
          // Pre-fill form with existing profile data
          setSeekerFormName(data.profile.fullName || '');
          setSeekerFormLocation(data.profile.location || '');
          setSeekerFormEmail(data.profile.contactEmail || '');
          setSeekerFormPhone(data.profile.phoneNumber || '');
          setSeekerFormEducation(data.profile.education || []);
          setSeekerFormExperience(data.profile.experience || []);
          setSeekerFormSkills(data.profile.skills || []);
        } else if (response.status === 404) {
          setSeekerProfile(null);
        } else {
          throw new Error('Failed to fetch profile.');
        }
      } catch (err) {
        console.error('Error fetching seeker profile:', err);
        setSeekerError('Could not load your profile. Please try again.');
      } finally {
        setSeekerLoading(false);
      }
    };
    fetchSeekerProfile();
  }, [isLoggedIn]);

  // --- FETCH ALL JOB SEEKER PROFILES (for list display) (UNCHANGED) ---
  const fetchAllSeekerProfiles = async () => {
    setListProfilesLoading(true);
    setListProfilesError(null);
    try {
      const response = await fetch('/api/job-seekers'); // API to get all profiles
      if (!response.ok) {
        throw new Error('Failed to fetch all job seeker profiles.');
      }
      const data: JobSeekerProfile[] = await response.json();
      setAllSeekerProfiles(data);
    } catch (err) {
      console.error('Error fetching all seeker profiles:', err);
      setListProfilesError('Could not load job seeker profiles. Please try again.');
    } finally {
      setListProfilesLoading(false);
    }
  };

  // --- FETCH ALL JOB POSTINGS (for list display) (NEW/MODIFIED) ---
  const fetchAllJobPostings = async () => {
    setListPostingsLoading(true);
    setListPostingsError(null);
    try {
      const response = await fetch('/api/job-postings'); // API to get all job postings
      if (!response.ok) {
        throw new Error('Failed to fetch job postings.');
      }
      const data: JobPosting[] = await response.json();
      setAllJobPostings(data);
    } catch (err) {
      console.error('Error fetching all job postings:', err);
      setListPostingsError('Could not load job postings. Please try again.');
    } finally {
      setListPostingsLoading(false);
    }
  };

  // Fetch all lists when component mounts (no tab dependency anymore)
  useEffect(() => {
    fetchAllSeekerProfiles();
    fetchAllJobPostings();
  }, []); // Empty dependency array means this runs once on mount

  // --- JOB SEEKER PROFILE FORM HANDLERS (UNCHANGED) ---
  const handleAddEducation = () => {
    setSeekerFormEducation([...seekerFormEducation, { degree: '', fieldOfStudy: '', institution: '', graduationDate: '' }]);
  };

  const handleEducationChange = (index: number, field: keyof JobSeekerProfile['education'][0], value: string) => {
    const newEducation = [...seekerFormEducation];
    (newEducation[index] as any)[field] = value;
    setSeekerFormEducation(newEducation);
  };

  const handleRemoveEducation = (index: number) => {
    setSeekerFormEducation(seekerFormEducation.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setSeekerFormExperience([...seekerFormExperience, { jobTitle: '', companyName: '', startDate: '', description: '' }]);
  };

  const handleExperienceChange = (index: number, field: keyof JobSeekerProfile['experience'][0], value: string) => {
    const newExperience = [...seekerFormExperience];
    (newExperience[index] as any)[field] = value;
    setSeekerFormExperience(newExperience);
  };

  const handleRemoveExperience = (index: number) => {
    setSeekerFormExperience(seekerFormExperience.filter((_, i) => i !== index));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekerFormSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean));
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSeekerFormResumeFile(e.target.files[0]);
    } else {
      setSeekerFormResumeFile(null);
    }
  };

  const handleSeekerProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeekerFormLoading(true);
    setSeekerFormError(null);
    setSeekerFormSuccess(null);

    if (!isLoggedIn) {
      setSeekerFormError('Please log in to create/update your profile.');
      setSeekerFormLoading(false);
      router.push('/login');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('fullName', seekerFormName);
    formData.append('location', seekerFormLocation);
    formData.append('contactEmail', seekerFormEmail);
    formData.append('phoneNumber', seekerFormPhone);
    formData.append('education', JSON.stringify(seekerFormEducation));
    formData.append('experience', JSON.stringify(seekerFormExperience));
    formData.append('skills', JSON.stringify(seekerFormSkills));
    if (seekerFormResumeFile) {
      formData.append('resume', seekerFormResumeFile);
    }

    try {
      const response = await fetch('/api/job-seekers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSeekerFormSuccess(data.message || 'Profile saved successfully!');
        setSeekerProfile(data.profile);
        fetchAllSeekerProfiles();
      } else {
        const errorData = await response.json();
        setSeekerFormError(`Error saving profile: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Network error saving profile:', err);
      setSeekerFormError('Network error. Could not save profile.');
    } finally {
      setSeekerFormLoading(false);
    }
  };

  // --- JOB POSTING FORM HANDLERS (NEW) ---
  const handleJobPostingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingFormLoading(true);
    setPostingFormError(null);
    setPostingFormSuccess(null);

    if (!isLoggedIn) {
      setPostingFormError('Please log in to submit a job posting.');
      setPostingFormLoading(false);
      router.push('/login');
      return;
    }

    // Basic validation
    if (!postingFormJobTitle || !postingFormCompanyName || !postingFormLocation || !postingFormJobDescription || !postingFormEmploymentType || !postingFormApplicationInstructions || !postingFormContactEmail) {
      setPostingFormError('Please fill in all required fields.');
      setPostingFormLoading(false);
      return;
    }

    const token = localStorage.getItem('token');

    const newPostingData = {
      jobTitle: postingFormJobTitle,
      companyName: postingFormCompanyName,
      location: postingFormLocation,
      jobDescription: postingFormJobDescription,
      responsibilities: postingFormResponsibilities,
      qualifications: postingFormQualifications,
      employmentType: postingFormEmploymentType,
      salaryRange: postingFormSalaryRange || undefined,
      applicationInstructions: postingFormApplicationInstructions,
      contactEmail: postingFormContactEmail,
      contactPersonName: postingFormContactPersonName || undefined,
      contactPersonEmail: postingFormContactPersonEmail || undefined,
      deadline: postingFormDeadline || undefined,
      status: 'active' as 'active', // Default status
    };

    try {
      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPostingData),
      });

      if (response.ok) {
        const data = await response.json();
        setPostingFormSuccess(data.message || 'Job posting submitted successfully!');
        console.log('Job Posting submitted:', data.jobPosting);
        fetchAllJobPostings(); // Refresh the list of postings
        // Clear form fields
        setPostingFormJobTitle('');
        setPostingFormCompanyName('');
        setPostingFormLocation('');
        setPostingFormJobDescription('');
        setPostingFormResponsibilities('');
        setPostingFormQualifications('');
        setPostingFormEmploymentType('');
        setPostingFormSalaryRange('');
        setPostingFormApplicationInstructions('');
        setPostingFormContactEmail('');
        setPostingFormContactPersonName('');
        setPostingFormContactPersonEmail('');
        setPostingFormDeadline('');
      } else {
        const errorData = await response.json();
        setPostingFormError(`Error submitting job posting: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Network error submitting job posting:', err);
      setPostingFormError('Network error. Could not submit job posting.');
    } finally {
      setPostingFormLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <h1 className={styles.mainTitle}>Jobs & Careers Hub</h1>

        {/* Section 1: Your Job Seeker Profile */}
        <div className={styles.tabSection}> {/* Reusing tabSection for general section styling */}
          <h2 className={styles.sectionTitle}>Your Job Seeker Profile</h2>
          {!isLoggedIn ? (
            <p className={styles.loginPrompt}>Please <Link href="/login" className={styles.loginLink}>log in</Link> to create or manage your job seeker profile.</p>
          ) : seekerLoading ? (
            <p className={styles.loadingMessage}>Loading your profile...</p>
          ) : seekerError ? (
            <p className={styles.errorMessage}>{seekerError}</p>
          ) : (
            <div className={styles.profileFormContainer}>
              <form onSubmit={handleSeekerProfileSubmit} className={styles.seekerProfileForm}>
                <h3>Personal Information</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="seekerName">Full Name:</label>
                  <input type="text" id="seekerName" value={seekerFormName} onChange={(e) => setSeekerFormName(e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="seekerLocation">Location:</label>
                  <input type="text" id="seekerLocation" value={seekerFormLocation} onChange={(e) => setSeekerFormLocation(e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="seekerEmail">Contact Email:</label>
                  <input type="email" id="seekerEmail" value={seekerFormEmail} onChange={(e) => setSeekerFormEmail(e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="seekerPhone">Phone Number (Optional):</label>
                  <input type="tel" id="seekerPhone" value={seekerFormPhone} onChange={(e) => setSeekerFormPhone(e.target.value)} className={styles.inputField} disabled={seekerFormLoading} placeholder="+1 555 123 4567" />
                </div>

                <h3>Education</h3>
                {seekerFormEducation.map((edu, index) => (
                  <div key={index} className={styles.dynamicFormItem}>
                    <div className={styles.formGroup}>
                      <label htmlFor={`eduDegree-${index}`}>Degree/Qualification:</label>
                      <input type="text" id={`eduDegree-${index}`} value={edu.degree} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`eduField-${index}`}>Field of Study:</label>
                      <input type="text" id={`eduField-${index}`} value={edu.fieldOfStudy} onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`eduInstitution-${index}`}>University/Institution:</label>
                      <input type="text" id={`eduInstitution-${index}`} value={edu.institution} onChange={(e) => handleEducationChange(index, 'institution', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`eduGradDate-${index}`}>Graduation Date (YYYY-MM):</label>
                      <input type="month" id={`eduGradDate-${index}`} value={edu.graduationDate} onChange={(e) => handleEducationChange(index, 'graduationDate', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`eduDesc-${index}`}>Description (Optional):</label>
                      <textarea id={`eduDesc-${index}`} value={edu.description || ''} onChange={(e) => handleEducationChange(index, 'description', e.target.value)} className={styles.textareaField} disabled={seekerFormLoading} rows={2}></textarea>
                    </div>
                    <button type="button" onClick={() => handleRemoveEducation(index)} className={styles.removeButton} disabled={seekerFormLoading}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddEducation} className={styles.addButton} disabled={seekerFormLoading}>+ Add Education</button>

                <h3>Experience</h3>
                {seekerFormExperience.map((exp, index) => (
                  <div key={index} className={styles.dynamicFormItem}>
                    <div className={styles.formGroup}>
                      <label htmlFor={`expTitle-${index}`}>Job Title:</label>
                      <input type="text" id={`expTitle-${index}`} value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, 'jobTitle', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`expCompany-${index}`}>Company Name:</label>
                      <input type="text" id={`expCompany-${index}`} value={exp.companyName} onChange={(e) => handleExperienceChange(index, 'companyName', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`expStartDate-${index}`}>Start Date (YYYY-MM):</label>
                      <input type="month" id={`expStartDate-${index}`} value={exp.startDate} onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)} required className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`expEndDate-${index}`}>End Date (YYYY-MM, leave blank if current):</label>
                      <input type="month" id={`expEndDate-${index}`} value={exp.endDate || ''} onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)} className={styles.inputField} disabled={seekerFormLoading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor={`expDesc-${index}`}>Responsibilities & Achievements:</label>
                      <textarea id={`expDesc-${index}`} value={exp.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} required className={styles.textareaField} disabled={seekerFormLoading} rows={4}></textarea>
                    </div>
                    <button type="button" onClick={() => handleRemoveExperience(index)} className={styles.removeButton} disabled={seekerFormLoading}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddExperience} className={styles.addButton} disabled={seekerFormLoading}>+ Add Experience</button>

                <h3>Skills</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="seekerSkills">Skills (comma-separated):</label>
                  <input type="text" id="seekerSkills" value={seekerFormSkills.join(', ')} onChange={handleSkillsChange} required className={styles.inputField} disabled={seekerFormLoading} placeholder="e.g., Python, Project Management, SEO" />
                </div>

                <h3>Resume</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="seekerResume">Upload Resume (PDF/DOCX):</label>
                  <input type="file" id="seekerResume" accept=".pdf,.doc,.docx" onChange={handleResumeFileChange} className={styles.fileInput} disabled={seekerFormLoading} />
                  {seekerFormResumeFile && <p className={styles.fileInfo}>Selected: {seekerFormResumeFile.name}</p>}
                  {seekerProfile?.resumeUrl && !seekerFormResumeFile && <p className={styles.fileInfo}>Current Resume: <a href={seekerProfile.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>View Current Resume</a></p>}
                  <p className={styles.inputHint}>(Max 5MB. Uploading a new file will replace the current one.)</p>
                </div>

                {seekerFormError && <p className={styles.errorMessage}>{seekerFormError}</p>}
                {seekerFormSuccess && <p className={styles.successMessage}>{seekerFormSuccess}</p>}
                <button type="submit" disabled={seekerFormLoading} className={styles.submitButton}>
                  {seekerFormLoading ? 'Saving Profile...' : (seekerProfile ? 'Update Profile' : 'Create Profile')}
                </button>
              </form>
            </div>
          )}

          {/* List of all Job Seeker Profiles */}
          <div className={styles.listSection}>
            <h2 className={styles.listTitle}>All Job Seeker Profiles</h2>
            {listProfilesLoading ? (
              <p className={styles.loadingMessage}>Loading profiles...</p>
            ) : listProfilesError ? (
              <p className={styles.errorMessage}>{listProfilesError}</p>
            ) : allSeekerProfiles.length === 0 ? (
              <p className={styles.noDataMessage}>No job seeker profiles available yet.</p>
            ) : (
              <ul className={styles.dataList}>
                {allSeekerProfiles.map(profile => (
                  <li key={profile.id} className={styles.dataCard}>
                    <h3 className={styles.cardTitle}>{profile.fullName}</h3>
                    <p className={styles.cardDetail}>**Location:** {profile.location}</p>
                    <p className={styles.cardDetail}>**Email:** {profile.contactEmail}</p>
                    {profile.phoneNumber && <p className={styles.cardDetail}>**Phone:** {profile.phoneNumber}</p>}
                    {profile.skills.length > 0 && <p className={styles.cardDetail}>**Skills:** {profile.skills.join(', ')}</p>}
                    {profile.resumeUrl && <p className={styles.cardDetail}><a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>View Resume</a></p>}
                    {profile.education.length > 0 && (
                      <div className={styles.cardSection}>
                        <h4>Education:</h4>
                        {profile.education.map((edu, idx) => (
                          <p key={idx} className={styles.subDetail}>
                            {edu.degree} in {edu.fieldOfStudy} from {edu.institution} ({edu.graduationDate})
                          </p>
                        ))}
                      </div>
                    )}
                    {profile.experience.length > 0 && (
                      <div className={styles.cardSection}>
                        <h4>Experience:</h4>
                        {profile.experience.map((exp, idx) => (
                          <p key={idx} className={styles.subDetail}>
                            {exp.jobTitle} at {exp.companyName} ({exp.startDate} - {exp.endDate || 'Current'})
                          </p>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Section 2: Submit a New Job Posting */}
        <div className={styles.tabSection}> {/* Reusing tabSection for general section styling */}
          <h2 className={styles.sectionTitle}>Submit a New Job Posting</h2>
          {!isLoggedIn ? (
            <p className={styles.loginPrompt}>Please <Link href="/login" className={styles.loginLink}>log in</Link> to submit a job posting.</p>
          ) : (
            <div className={styles.referralFormContainer}> {/* Reusing container style */}
              <form onSubmit={handleJobPostingSubmit} className={styles.referralForm}> {/* Reusing form style */}
                <h3>Job Details</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="postingJobTitle">Job Title:</label>
                  <input type="text" id="postingJobTitle" value={postingFormJobTitle} onChange={(e) => setPostingFormJobTitle(e.target.value)} required className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingCompanyName">Company Name:</label>
                  <input type="text" id="postingCompanyName" value={postingFormCompanyName} onChange={(e) => setPostingFormCompanyName(e.target.value)} required className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingLocation">Location:</label>
                  <input type="text" id="postingLocation" value={postingFormLocation} onChange={(e) => setPostingFormLocation(e.target.value)} required className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingEmploymentType">Employment Type:</label>
                  <select id="postingEmploymentType" value={postingFormEmploymentType} onChange={(e) => setPostingFormEmploymentType(e.target.value as JobPosting['employmentType'])} required className={styles.selectField} disabled={postingFormLoading}>
                    <option value="">-- Select Type --</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingSalaryRange">Salary Range (Optional, e.g., $80,000 - $100,000):</label>
                  <input type="text" id="postingSalaryRange" value={postingFormSalaryRange} onChange={(e) => setPostingFormSalaryRange(e.target.value)} className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingJobDescription">Job Description:</label>
                  <textarea id="postingJobDescription" value={postingFormJobDescription} onChange={(e) => setPostingFormJobDescription(e.target.value)} required className={styles.textareaField} disabled={postingFormLoading} rows={8}></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingResponsibilities">Responsibilities:</label>
                  <textarea id="postingResponsibilities" value={postingFormResponsibilities} onChange={(e) => setPostingFormResponsibilities(e.target.value)} required className={styles.textareaField} disabled={postingFormLoading} rows={4}></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingQualifications">Qualifications:</label>
                  <textarea id="postingQualifications" value={postingFormQualifications} onChange={(e) => setPostingFormQualifications(e.target.value)} required className={styles.textareaField} disabled={postingFormLoading} rows={4}></textarea>
                </div>

                <h3>Application & Contact Info</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="postingApplicationInstructions">Application Instructions:</label>
                  <textarea id="postingApplicationInstructions" value={postingFormApplicationInstructions} onChange={(e) => setPostingFormApplicationInstructions(e.target.value)} required className={styles.textareaField} disabled={postingFormLoading} rows={4}></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingContactEmail">General Contact Email:</label>
                  <input type="email" id="postingContactEmail" value={postingFormContactEmail} onChange={(e) => setPostingFormContactEmail(e.target.value)} required className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingContactPersonName">Contact Person Name (Optional):</label>
                  <input type="text" id="postingContactPersonName" value={postingFormContactPersonName} onChange={(e) => setPostingFormContactPersonName(e.target.value)} className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingContactPersonEmail">Contact Person Email (Optional):</label>
                  <input type="email" id="postingContactPersonEmail" value={postingFormContactPersonEmail} onChange={(e) => setPostingFormContactPersonEmail(e.target.value)} className={styles.inputField} disabled={postingFormLoading} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="postingDeadline">Application Deadline (Optional):</label>
                  <input type="date" id="postingDeadline" value={postingFormDeadline} onChange={(e) => setPostingFormDeadline(e.target.value)} className={styles.inputField} disabled={postingFormLoading} />
                </div>

                {postingFormError && <p className={styles.errorMessage}>{postingFormError}</p>}
                {postingFormSuccess && <p className={styles.successMessage}>{postingFormSuccess}</p>}
                <button type="submit" disabled={postingFormLoading} className={styles.submitButton}>
                  {postingFormLoading ? 'Submitting...' : 'Submit Job Posting'}
                </button>
              </form>
            </div>
          )}

          {/* List of all Job Postings */}
          <div className={styles.listSection}>
            <h2 className={styles.listTitle}>All Available Job Postings</h2>
            {listPostingsLoading ? (
              <p className={styles.loadingMessage}>Loading job postings...</p>
            ) : listPostingsError ? (
              <p className={styles.errorMessage}>{listPostingsError}</p>
            ) : allJobPostings.length === 0 ? (
              <p className={styles.noDataMessage}>No job postings available yet.</p>
            ) : (
              <ul className={styles.dataList}>
                {allJobPostings.map(posting => (
                  <li key={posting.id} className={styles.dataCard}>
                    <h3 className={styles.cardTitle}>{posting.jobTitle} at {posting.companyName}</h3>
                    <p className={styles.cardDetail}>**Location:** {posting.location}</p>
                    <p className={styles.cardDetail}>**Employment Type:** {posting.employmentType}</p>
                    {posting.salaryRange && <p className={styles.cardDetail}>**Salary:** {posting.salaryRange}</p>}
                    <p className={styles.cardDetail}>**Description:** {posting.jobDescription.substring(0, 150)}...</p>
                    <p className={styles.cardDetail}>**Responsibilities:** {posting.responsibilities.substring(0, 100)}...</p>
                    <p className={styles.cardDetail}>**Qualifications:** {posting.qualifications.substring(0, 100)}...</p>
                    <p className={styles.cardDetail}>**Contact:** {posting.contactEmail} {posting.contactPersonName ? `(${posting.contactPersonName})` : ''}</p>
                    {posting.deadline && <p className={styles.cardDetail}>**Deadline:** {new Date(posting.deadline).toLocaleDateString()}</p>}
                    <Link href={`#job-${posting.id}`} className={styles.cardLink}>View Full Details</Link>
                    {/* In a real app, you'd likely have a dedicated job detail page */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}