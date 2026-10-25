import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileText,
  Search,
  Check,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  ArrowRight,
  Send,
  Sparkles,
  BookOpen,
  Award,
  RotateCcw
} from 'lucide-react';
import {
  COURSES,
  COURSE_CATEGORIES,
  COUNTRY_CODES,
  Course,
  CountryCode
} from '../data/courses';

interface FormData {
  course: string;
  courseId: string;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  collegeName: string;
  location: string;
  additionalNotes: string;
  honeypot: string;
}

interface FormErrors {
  course?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  collegeName?: string;
  location?: string;
  additionalNotes?: string;
  general?: string;
}

interface SubmissionResult {
  registrationId: string;
  course: string;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  collegeName?: string | null;
  location?: string | null;
  additionalNotes?: string | null;
  createdAt: string;
  telegramDelivered: boolean;
}

export default function CourseRegistration() {
  const formId = useId();

  // Form State
  const [formData, setFormData] = useState<FormData>({
    course: '',
    courseId: '',
    fullName: '',
    countryCode: '+91',
    phoneNumber: '',
    email: '',
    collegeName: '',
    location: '',
    additionalNotes: '',
    honeypot: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionResult | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Course Dropdown state
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [activeCourseIndex, setActiveCourseIndex] = useState(-1);
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const courseSearchInputRef = useRef<HTMLInputElement>(null);

  // Country Code Dropdown state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);

  // Selected Country object
  const selectedCountry = useMemo(() => {
    return (
      COUNTRY_CODES.find((c) => c.dialCode === formData.countryCode) ||
      COUNTRY_CODES[0]
    );
  }, [formData.countryCode]);

  // Telegram status indicator
  const [telegramStatus, setTelegramStatus] = useState<{
    configured: boolean;
    checked: boolean;
  }>({ configured: false, checked: false });

  useEffect(() => {
    fetch('/api/registration/status')
      .then((res) => res.json())
      .then((data) => {
        setTelegramStatus({
          configured: Boolean(data.telegramConfigured || data.configured),
          checked: true
        });
      })
      .catch(() => {
        setTelegramStatus({ configured: false, checked: true });
      });
  }, []);

  // Filtered Courses based on search (without duration)
  const filteredCourses = useMemo(() => {
    const q = courseSearchQuery.trim().toLowerCase();
    if (!q) return COURSES;
    return COURSES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [courseSearchQuery]);

  // Filtered Countries based on search
  const filteredCountries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCourseDropdownOpen(false);
      }
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when course dropdown opens
  useEffect(() => {
    if (isCourseDropdownOpen) {
      setTimeout(() => {
        courseSearchInputRef.current?.focus();
      }, 50);
    } else {
      setCourseSearchQuery('');
      setActiveCourseIndex(-1);
    }
  }, [isCourseDropdownOpen]);

  // Focus country search input when country dropdown opens
  useEffect(() => {
    if (isCountryDropdownOpen) {
      setTimeout(() => {
        countrySearchInputRef.current?.focus();
      }, 50);
    } else {
      setCountrySearchQuery('');
    }
  }, [isCountryDropdownOpen]);

  // Handle course selection
  const handleSelectCourse = (course: Course) => {
    setFormData((prev) => ({
      ...prev,
      course: course.name,
      courseId: course.id
    }));
    setFormErrors((prev) => ({ ...prev, course: undefined, general: undefined }));
    setIsCourseDropdownOpen(false);
  };

  const handleClearCourse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData((prev) => ({ ...prev, course: '', courseId: '' }));
    setIsCourseDropdownOpen(false);
  };

  // Keyboard navigation inside course dropdown
  const handleCourseKeyDown = (e: React.KeyboardEvent) => {
    if (!isCourseDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsCourseDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsCourseDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCourseIndex((prev) =>
        prev < filteredCourses.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCourseIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCourses.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeCourseIndex >= 0 && filteredCourses[activeCourseIndex]) {
        handleSelectCourse(filteredCourses[activeCourseIndex]);
      }
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Course selection validation
    if (!formData.course.trim()) {
      errors.course = 'Please select a course from the list.';
    }

    // Full Name validation
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      errors.fullName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.fullName = 'Full name cannot exceed 100 characters.';
    }

    // Phone Number validation
    const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
    if (!digitsOnly) {
      errors.phoneNumber = 'Phone number is required.';
    } else if (formData.countryCode === '+91' && digitsOnly.length !== 10) {
      errors.phoneNumber = 'Please enter a valid 10-digit Indian mobile number.';
    } else if (digitsOnly.length < selectedCountry.minLength || digitsOnly.length > selectedCountry.maxLength + 2) {
      errors.phoneNumber = `Please enter a valid ${selectedCountry.name} phone number (${selectedCountry.minLength}–${selectedCountry.maxLength} digits).`;
    }

    // Email validation
    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. your@email.com).';
    } else if (trimmedEmail.length > 100) {
      errors.email = 'Email cannot exceed 100 characters.';
    }

    // Optional fields length restrictions
    if (formData.collegeName.trim().length > 150) {
      errors.collegeName = 'College name cannot exceed 150 characters.';
    }
    if (formData.location.trim().length > 100) {
      errors.location = 'Location cannot exceed 100 characters.';
    }
    if (formData.additionalNotes.trim().length > 2000) {
      errors.additionalNotes = 'Additional notes cannot exceed 2,000 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Input change handler
  const handleInputChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = document.querySelector('[data-invalid="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: formData.course,
          courseId: formData.courseId,
          fullName: formData.fullName,
          countryCode: formData.countryCode,
          phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
          email: formData.email,
          collegeName: formData.collegeName || null,
          location: formData.location || null,
          additionalNotes: formData.additionalNotes || null,
          _hp: formData.honeypot
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.field) {
          setFormErrors({ [data.field]: data.error });
        } else {
          setFormErrors({ general: data.error || 'Failed to submit course registration. Please try again.' });
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmissionSuccess({
        registrationId: data.registrationId || data.registration?.id || 'STA-CONFIRMED',
        course: formData.course,
        fullName: formData.fullName,
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
        email: formData.email,
        collegeName: formData.collegeName,
        location: formData.location,
        additionalNotes: formData.additionalNotes,
        createdAt: data.registration?.createdAt || new Date().toISOString(),
        telegramDelivered: Boolean(data.registration?.telegramDelivered)
      });
      setIsSubmitting(false);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[Course Registration] Error:', err);
      setFormErrors({
        general: 'Connection error while communicating with the registration server. Please check your network and try again.'
      });
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      course: '',
      courseId: '',
      fullName: '',
      countryCode: '+91',
      phoneNumber: '',
      email: '',
      collegeName: '',
      location: '',
      additionalNotes: '',
      honeypot: ''
    });
    setFormErrors({});
    setSubmissionSuccess(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto selection:bg-white/20 selection:text-white">
      {/* Academy Header Minimalist Block */}
      <div className="mb-8 sm:mb-10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-white/50 select-none">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="uppercase tracking-widest">DZt Student Training Academy</span>
          <span className="text-white/20">/</span>
          <span className="text-white/70">Admissions Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-white uppercase leading-none">
          Course Registration
        </h1>
        <p className="text-sm text-white/50 font-sans font-light max-w-xl leading-relaxed">
          Search and enroll in certified engineering programs, GenAI diplomas, and specialized technical curriculum tracks.
        </p>
      </div>

      {/* Main Form Frame - Matches Website Dark Minimalist Theme */}
      <div className="bg-[#0c0c0c] border border-white/10 rounded-xs overflow-hidden">
        {/* Frame Top Meta Bar */}
        <div className="px-6 py-3.5 bg-black/50 border-b border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-wider">Application Form</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Send className="w-3 h-3 text-cyan-400" />
            <span>Telegram Bot:</span>
            <span className={telegramStatus.configured ? 'text-emerald-400' : 'text-white/40'}>
              {telegramStatus.configured ? 'Relay Active' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Content Body: Form OR Success State */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {submissionSuccess ? (
              /* SUCCESS STATE */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="p-6 sm:p-8 bg-black/60 border border-white/10 rounded-xs space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xs bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                        Enrollment Logged
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Registration Submitted
                      </h2>
                      <p className="text-xs sm:text-sm text-white/70 leading-relaxed pt-1">
                        Thank you for registering! Your course registration has been submitted successfully. Our team will contact you soon.
                      </p>
                    </div>
                  </div>

                  {/* Monospace Registration Receipt Details */}
                  <div className="p-4 bg-[#080808] border border-white/10 rounded-xs space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-white/40 uppercase tracking-wider text-[10px]">
                        Registration ID
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(submissionSuccess.registrationId)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-xs transition-colors cursor-pointer"
                        title="Copy Registration ID"
                      >
                        <span>{submissionSuccess.registrationId}</span>
                        {copiedId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-white/50" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 text-white/80 text-[11px]">
                      <div className="flex justify-between gap-4">
                        <span className="text-white/40">Course:</span>
                        <span className="text-white font-sans font-medium text-right">
                          {submissionSuccess.course}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-white/40">Applicant:</span>
                        <span className="text-white">{submissionSuccess.fullName}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-white/40">Contact:</span>
                        <span className="text-white">
                          {submissionSuccess.countryCode} {submissionSuccess.phoneNumber}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-white/40">Email:</span>
                        <span className="text-white">{submissionSuccess.email}</span>
                      </div>
                      {submissionSuccess.collegeName && (
                        <div className="flex justify-between gap-4">
                          <span className="text-white/40">College:</span>
                          <span className="text-white">{submissionSuccess.collegeName}</span>
                        </div>
                      )}
                      {submissionSuccess.location && (
                        <div className="flex justify-between gap-4">
                          <span className="text-white/40">Location:</span>
                          <span className="text-white">{submissionSuccess.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="w-full sm:w-auto px-6 py-3 bg-white text-black text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Register Another Course</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* General server error alert if any */}
                {formErrors.general && (
                  <div className="p-3.5 bg-red-950/40 border border-red-500/50 rounded-xs flex items-start gap-3 text-xs text-red-200">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">{formErrors.general}</div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* SECTION 1: SEARCHABLE COURSE SELECTION DROPDOWN           */}
                {/* ========================================================= */}
                <div ref={courseDropdownRef} className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      id="label-course-select"
                      className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80 select-none"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-white/40" />
                      <span>Select Course</span>
                      <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                    </label>

                    {formData.course && (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Course Dropdown Trigger Button */}
                  <div
                    tabIndex={0}
                    role="combobox"
                    aria-expanded={isCourseDropdownOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="label-course-select"
                    data-invalid={Boolean(formErrors.course)}
                    onClick={() => setIsCourseDropdownOpen((prev) => !prev)}
                    onKeyDown={handleCourseKeyDown}
                    className={`min-h-[46px] w-full px-3.5 py-2.5 bg-black/60 border rounded-xs text-sm transition-all flex items-center justify-between cursor-pointer focus:outline-hidden focus:border-white ${
                      formErrors.course
                        ? 'border-red-500/80 bg-red-950/20'
                        : isCourseDropdownOpen
                        ? 'border-white bg-black'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                      {formData.course ? (
                        <span className="text-white font-medium truncate text-sm">
                          {formData.course}
                        </span>
                      ) : (
                        <span className="text-white/30 select-none text-sm">
                          Search & select course
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-white/40">
                      {formData.course && (
                        <button
                          type="button"
                          onClick={handleClearCourse}
                          className="p-1 hover:text-white rounded-xs transition-colors cursor-pointer"
                          title="Clear selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isCourseDropdownOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Inline Error for Course */}
                  {formErrors.course && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.course}
                    </p>
                  )}

                  {/* Course Dropdown Menu Floating Box */}
                  <AnimatePresence>
                    {isCourseDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[#0e0e0e] border border-white/20 rounded-xs shadow-2xl overflow-hidden"
                      >
                        {/* Search Input Box */}
                        <div className="p-2.5 border-b border-white/10 bg-black/50">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 pointer-events-none" />
                            <input
                              ref={courseSearchInputRef}
                              type="text"
                              value={courseSearchQuery}
                              onChange={(e) => {
                                setCourseSearchQuery(e.target.value);
                                setActiveCourseIndex(0);
                              }}
                              onKeyDown={handleCourseKeyDown}
                              placeholder="Type to filter 35 courses..."
                              className="w-full pl-9 pr-8 py-2 text-xs font-mono bg-black border border-white/15 rounded-xs text-white placeholder:text-white/30 focus:outline-hidden focus:border-white"
                            />
                            {courseSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCourseSearchQuery('')}
                                className="absolute right-2.5 text-white/40 hover:text-white p-0.5 rounded-xs cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Courses Options List (duration removed) */}
                        <div
                          role="listbox"
                          className="max-h-72 overflow-y-auto divide-y divide-white/5 p-1"
                        >
                          {filteredCourses.length === 0 ? (
                            <div className="py-8 px-4 text-center text-xs text-white/50 font-mono">
                              <p className="text-white/80">No matching courses found</p>
                              <p className="text-white/40 mt-1">
                                Try searching for terms like &quot;GenAI&quot;, &quot;Engineer&quot;, or &quot;Diploma&quot;.
                              </p>
                            </div>
                          ) : (
                            filteredCourses.map((course, idx) => {
                              const isSelected = formData.course === course.name;
                              const isKeyboardFocused = activeCourseIndex === idx;

                              return (
                                <div
                                  key={course.id}
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => handleSelectCourse(course)}
                                  onMouseEnter={() => setActiveCourseIndex(idx)}
                                  className={`p-3 rounded-xs text-left cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? 'bg-white/15 text-white font-medium border-l-2 border-white'
                                      : isKeyboardFocused
                                      ? 'bg-white/5 text-white'
                                      : 'hover:bg-white/[0.03] text-white/80'
                                  }`}
                                >
                                  <div className="flex-1 space-y-0.5">
                                    <div className="text-xs sm:text-sm font-sans leading-snug">
                                      {course.name}
                                    </div>
                                    <div className="text-[10px] font-mono uppercase text-white/40">
                                      {course.category}
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="shrink-0 text-white">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Dropdown Footer Count */}
                        <div className="px-3 py-2 bg-black/60 border-t border-white/10 text-[10px] font-mono text-white/40 flex justify-between items-center select-none">
                          <span>Showing {filteredCourses.length} of {COURSES.length} courses</span>
                          <span className="text-white/30">All 35 courses available</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subtle Divider below Course Selector per Specification */}
                <hr className="border-t border-white/10 my-6" />

                {/* ========================================================= */}
                {/* SECTION 2: REGISTRATION FORM FIELDS                       */}
                {/* ========================================================= */}

                {/* Honeypot field for bot spam protection */}
                <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                  <input
                    type="text"
                    name="_hp"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.honeypot}
                    onChange={(e) => handleInputChange('honeypot', e.target.value)}
                  />
                </div>

                {/* Field 1: Full Name (Required) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`${formId}-fullName`}
                      className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80"
                    >
                      <User className="w-3.5 h-3.5 text-white/40" />
                      <span>Full Name</span>
                      <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-white/30">{formData.fullName.length}/100</span>
                  </div>
                  <input
                    id={`${formId}-fullName`}
                    name="fullName"
                    type="text"
                    required
                    data-invalid={Boolean(formErrors.fullName)}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-black/60 border rounded-xs text-sm text-white placeholder:text-white/30 transition-colors focus:outline-hidden focus:border-white ${
                      formErrors.fullName
                        ? 'border-red-500/80 bg-red-950/20'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Field 2: Phone Number with Country Code (Required) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${formId}-phoneNumber`}
                    className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80"
                  >
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                    <span>Phone Number</span>
                    <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Country Code Selector */}
                    <div ref={countryDropdownRef} className="relative sm:w-44 shrink-0">
                      <button
                        type="button"
                        id="btn-country-selector"
                        aria-expanded={isCountryDropdownOpen}
                        aria-haspopup="listbox"
                        onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                        className="w-full min-h-[44px] px-3 py-2 bg-black/60 border border-white/15 hover:border-white/30 rounded-xs text-sm text-white flex items-center justify-between gap-2 transition-colors focus:outline-hidden focus:border-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base select-none">{selectedCountry.flag}</span>
                          <span className="font-mono text-white text-xs">{selectedCountry.dialCode}</span>
                          <span className="text-[10px] font-mono text-white/40 truncate hidden xs:inline">({selectedCountry.code})</span>
                        </span>
                        <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
                      </button>

                      {/* Country Code Dropdown Popover */}
                      <AnimatePresence>
                        {isCountryDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute z-50 top-full left-0 w-64 mt-1.5 bg-[#0e0e0e] border border-white/20 rounded-xs shadow-2xl overflow-hidden"
                          >
                            <div className="p-2 border-b border-white/10 bg-black/50">
                              <input
                                ref={countrySearchInputRef}
                                type="text"
                                value={countrySearchQuery}
                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                placeholder="Filter code..."
                                className="w-full px-2.5 py-1.5 text-xs font-mono bg-black border border-white/15 rounded-xs text-white placeholder:text-white/30 focus:outline-hidden focus:border-white"
                              />
                            </div>
                            <div className="max-h-52 overflow-y-auto divide-y divide-white/5 p-1">
                              {filteredCountries.map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    handleInputChange('countryCode', c.dialCode);
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs rounded-xs flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${
                                    c.dialCode === formData.countryCode
                                      ? 'bg-white/15 font-semibold text-white'
                                      : 'text-white/80'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span className="text-sm">{c.flag}</span>
                                    <span className="truncate">{c.name}</span>
                                  </span>
                                  <span className="font-mono text-white/50 text-xs shrink-0 ml-2">
                                    {c.dialCode}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phone Input Box */}
                    <div className="flex-1">
                      <input
                        id={`${formId}-phoneNumber`}
                        name="phoneNumber"
                        type="tel"
                        required
                        data-invalid={Boolean(formErrors.phoneNumber)}
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder={selectedCountry.placeholder || '9876543210'}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-black/60 border rounded-xs text-sm text-white placeholder:text-white/30 transition-colors focus:outline-hidden focus:border-white font-mono ${
                          formErrors.phoneNumber
                            ? 'border-red-500/80 bg-red-950/20'
                            : 'border-white/15 hover:border-white/30'
                        }`}
                      />
                    </div>
                  </div>

                  {formErrors.phoneNumber && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Field 3: Email (Required) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${formId}-email`}
                    className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80"
                  >
                    <Mail className="w-3.5 h-3.5 text-white/40" />
                    <span>Email</span>
                    <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`${formId}-email`}
                    name="email"
                    type="email"
                    required
                    data-invalid={Boolean(formErrors.email)}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-black/60 border rounded-xs text-sm text-white placeholder:text-white/30 transition-colors focus:outline-hidden focus:border-white ${
                      formErrors.email
                        ? 'border-red-500/80 bg-red-950/20'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Field 4: College Name (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`${formId}-collegeName`}
                      className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80"
                    >
                      <Building2 className="w-3.5 h-3.5 text-white/40" />
                      <span>College Name</span>
                    </label>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Optional</span>
                  </div>
                  <input
                    id={`${formId}-collegeName`}
                    name="collegeName"
                    type="text"
                    value={formData.collegeName}
                    onChange={(e) => handleInputChange('collegeName', e.target.value)}
                    placeholder="e.g. St. Xavier's College"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-black/60 border border-white/15 hover:border-white/30 focus:border-white rounded-xs text-sm text-white placeholder:text-white/30 transition-colors focus:outline-hidden"
                  />
                  {formErrors.collegeName && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.collegeName}
                    </p>
                  )}
                </div>

                {/* Field 5: Location (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`${formId}-location`}
                      className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80"
                    >
                      <MapPin className="w-3.5 h-3.5 text-white/40" />
                      <span>Location</span>
                    </label>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Optional</span>
                  </div>
                  <input
                    id={`${formId}-location`}
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Your city"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-black/60 border border-white/15 hover:border-white/30 focus:border-white rounded-xs text-sm text-white placeholder:text-white/30 transition-colors focus:outline-hidden"
                  />
                  {formErrors.location && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.location}
                    </p>
                  )}
                </div>

                {/* Field 6: Any Additional Notes (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`${formId}-additionalNotes`}
                      className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/80"
                    >
                      <FileText className="w-3.5 h-3.5 text-white/40" />
                      <span>Any additional notes</span>
                    </label>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Optional</span>
                  </div>
                  <textarea
                    id={`${formId}-additionalNotes`}
                    name="additionalNotes"
                    rows={4}
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    placeholder="Tell us anything else..."
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 hover:border-white/30 focus:border-white rounded-xs text-sm text-white placeholder:text-white/30 transition-colors focus:outline-hidden resize-y"
                  />
                  {formErrors.additionalNotes && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.additionalNotes}
                    </p>
                  )}
                </div>

                {/* ========================================================= */}
                {/* SECTION 3: SUBMIT BUTTON & USER FEEDBACK                 */}
                {/* ========================================================= */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 px-6 rounded-xs text-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                      isSubmitting
                        ? 'bg-white/60 cursor-not-allowed'
                        : 'bg-white hover:bg-white/90 active:scale-[0.99]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Submitting Registration...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <ArrowRight className="w-4 h-4 text-black" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] font-mono text-white/40 uppercase tracking-wider mt-3 select-none">
                    Registration routed to admissions desk &amp; Telegram Bot
                  </p>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
