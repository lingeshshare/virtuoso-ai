# CLAUDE.md

# Virtuoso AI

## Mission

Virtuoso AI is an AI-powered practice coach for serious instrumental musicians.

The goal is to provide recording-specific feedback comparable to a private lesson teacher, All-State clinician, conservatory professor, or professional performer.

The application focuses exclusively on instrumental musicians.

Supported users include:

* Middle school band students
* Middle school orchestra students
* High school band students
* High school orchestra students
* Region candidates
* Area candidates
* All-State candidates
* College music majors
* Conservatory applicants

The product is not intended for:

* Singers
* Guitarists
* Producers
* Songwriters
* Casual music hobbyists

---

# Core Product Philosophy

Students do not want generic scores.

Students want answers.

Every feature should help answer:

1. What level am I currently performing at?
2. What specifically is wrong in my recording?
3. Why is it happening?
4. What prevents me from reaching the next level?
5. What should I practice next?

When making implementation decisions, prioritize actionable coaching over numerical scoring.

---

# Most Important Rule

Claude must never rely solely on LLM reasoning to analyze audio.

Audio analysis and coaching are separate systems.

Audio analysis generates objective metrics.

The coaching engine interprets those metrics.

Architecture:

Recording Upload
→ Audio Analysis Service
→ Structured Metrics
→ Diagnosis Engine
→ Claude Coaching Engine
→ Student Feedback

---

# Technical Stack

Frontend:

* Next.js
* React
* TypeScript
* Tailwind CSS

Backend:

* Node.js
* Python Audio Analysis Service

Database:

* Supabase

Authentication:

* Supabase Auth

Storage:

* Supabase Storage

AI:

* Claude API

---

# Audio Analysis Architecture

The Audio Analysis Service should be modular.

Future audio engines must be interchangeable.

Priority order:

Phase 1:

* librosa

Phase 2:

* CREPE

Phase 3:

* Spotify Basic Pitch

Phase 4:

* Essentia

Never tightly couple application logic to a specific audio library.

Use adapters/interfaces.

Example:

Audio File
→ Analysis Pipeline
→ Standardized Metrics JSON
→ Diagnosis Engine

The rest of the application should not know which audio library produced the metrics.

---

# Audio Analysis Responsibilities

librosa:

* tempo
* dynamics
* onset detection
* loudness
* timing features

CREPE:

* pitch tracking
* intonation
* pitch stability

Basic Pitch:

* note detection
* MIDI conversion
* timing extraction

Essentia:

* timbre
* articulation
* advanced spectral analysis

---

# AI Responsibilities

Claude is a teacher.

Claude is not the audio analyzer.

Claude receives structured metrics and diagnoses.

Claude generates:

* feedback
* explanations
* coaching
* practice plans
* gap analyses
* level estimates

Claude should never fabricate measurements.

If metrics are unavailable, explicitly state uncertainty.

---

# Reference Material System

Users may optionally upload:

* PDF sheet music
* MusicXML
* MIDI
* Audition packet
* Excerpt file

If reference material exists:

Enable:

* note accuracy analysis
* rhythm accuracy analysis
* tempo comparison
* score-aware feedback

If reference material does not exist:

Use:

* timestamp-based feedback
* performance-quality feedback
* diagnostic coaching

Avoid claiming exact note errors without a score reference.

---

# Instrument-Specific Intelligence

Do not use identical scoring systems across instruments.

Each instrument should have:

* unique rubrics
* unique weighting
* unique diagnostics
* unique practice recommendations

Examples:

Alto Saxophone:

* tone core
* voicing
* reed response
* articulation
* air support

Clarinet:

* break crossings
* throat tones
* register consistency

Trumpet:

* range control
* endurance
* slotting

Violin:

* bow control
* shifting
* intonation

---

# Benchmark Framework

Supported performance levels:

* Beginner
* Intermediate
* Advanced
* Region
* Area
* All-State
* College
* Conservatory
* Professional

Every analysis should attempt to estimate:

Current Level

Target Level

Gap Analysis

Example:

Current:
Region

Target:
All-State

Needed Improvement:

Tone +8

Articulation +6

Musicality +12

---

# Feedback Standards

Bad Feedback:

"Work on tone."

Bad Feedback:

"Practice articulation."

Good Feedback:

"From 0:42–0:51, articulation clarity decreases noticeably as tempo increases. Tongue motion appears inefficient, causing delayed note starts. Practice repeated-note exercises at quarter note = 84 BPM before increasing tempo."

All feedback should include:

* observation
* likely cause
* impact
* fix
* practice drill
* priority

---

# UI Principles

Design language:

* Apple-quality
* Professional
* Modern
* Dark-mode first
* Mobile-first
* Fast

Avoid:

* clutter
* excessive animations
* unnecessary complexity

Users should reach recording upload in as few clicks as possible.

---

# MVP Priorities

Build in this order:

1. Authentication
2. Instrument selection
3. Level selection
4. Recording upload
5. Audio processing pipeline
6. Feedback report
7. Practice plan
8. Progress tracking

Do not build advanced social features before the feedback engine works.

Do not build leaderboards before audio analysis works.

Do not build teacher dashboards before students receive meaningful feedback.

---

# Decision Framework

When uncertain, prioritize:

1. Feedback quality
2. Audio analysis quality
3. Practice recommendations
4. User experience
5. New features

A smaller feature set with exceptional feedback is preferred over many mediocre features.

Every major implementation decision should move the product closer to becoming the best AI private lesson teacher for instrumental musicians.
