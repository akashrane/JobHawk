"use client";

import { useRef, useState } from "react";
import { Upload, Star, Trash2, FileText, CheckCircle } from "lucide-react";
import { useDeleteResume, useResumes, useSetPrimary, useUploadResume } from "@/hooks/use-resumes";
import type { ParsedResume, Resume } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ResumePage() {
  const { data: resumes = [], isLoading } = useResumes();
  const upload = useUploadResume();
  const setPrimary = useSetPrimary();
  const deleteR = useDeleteResume();

  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("My Resume");
  const [dragging, setDragging] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  function handleFile(file: File) {
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) return;
    upload.mutate({ file, label });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Resume</h1>
      <p className="text-gray-500 mb-8">Upload your resume and the AI will parse and embed it for job matching.</p>

      {/* Upload area */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <h2 className="text-base font-semibold mb-4">Upload New Resume</h2>
        <div className="mb-3">
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. SWE-AI, PM-FinTech"
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm w-60 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          {upload.isPending ? (
            <p className="text-sm text-blue-600 font-medium">Uploading and parsing... please wait</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drag & drop a PDF or DOCX, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF or DOCX · max 5MB · DOCX recommended for tailored downloads</p>
            </>
          )}
        </div>

        {upload.isSuccess && (
          <div className="flex items-center gap-2 text-green-600 text-sm mt-3">
            <CheckCircle className="w-4 h-4" />
            Resume uploaded and parsed successfully!
          </div>
        )}
        {upload.isError && (
          <p className="text-red-600 text-sm mt-3">{(upload.error as Error).message}</p>
        )}
      </div>

      {/* Resume list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: resume cards */}
        <div className="lg:col-span-1">
          <h2 className="text-base font-semibold mb-3">Your Resumes</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No resumes uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  selected={selectedResume?.id === resume.id}
                  onSelect={() => setSelectedResume(resume)}
                  onSetPrimary={() => setPrimary.mutate(resume.id)}
                  onDelete={() => {
                    deleteR.mutate(resume.id);
                    if (selectedResume?.id === resume.id) setSelectedResume(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: parsed view */}
        <div className="lg:col-span-2">
          {selectedResume?.parsed_content ? (
            <ParsedResumeView parsed={selectedResume.parsed_content} />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a resume to view the parsed content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumeCard({
  resume,
  selected,
  onSelect,
  onSetPrimary,
  onDelete,
}: {
  resume: Resume;
  selected: boolean;
  onSelect: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer transition-colors ${
        selected
          ? "border-blue-500 ring-1 ring-blue-500"
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{resume.label}</p>
            {resume.is_primary && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Primary</span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{resume.file_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {!resume.is_primary && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetPrimary(); }}
              title="Set as primary"
              className="p-1 hover:text-yellow-500 text-gray-400 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            className="p-1 hover:text-red-500 text-gray-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ParsedResumeView({ parsed }: { parsed: ParsedResume }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{parsed.name}</h3>
        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
          {parsed.email && <span>{parsed.email}</span>}
          {parsed.phone && <span>{parsed.phone}</span>}
          {parsed.location && <span>{parsed.location}</span>}
        </div>
        {parsed.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{parsed.summary}</p>
        )}
      </div>

      {/* Skills */}
      {parsed.skills.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {parsed.skills.map((skill) => (
              <span key={skill} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {parsed.experience.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Experience</h4>
          <div className="space-y-4">
            {parsed.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold text-sm">{exp.title}</p>
                  <p className="text-xs text-gray-500">{exp.start_date} – {exp.end_date ?? "Present"}</p>
                </div>
                <p className="text-sm text-gray-500">{exp.company}</p>
                <ul className="mt-1 space-y-0.5">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-gray-600 dark:text-gray-400 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {parsed.education.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Education</h4>
          <div className="space-y-2">
            {parsed.education.map((edu, i) => (
              <div key={i}>
                <p className="font-semibold text-sm">{edu.institution}</p>
                <p className="text-sm text-gray-500">
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  {edu.graduation_date ? ` · ${edu.graduation_date}` : ""}
                  {edu.gpa ? ` · GPA ${edu.gpa}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {parsed.certifications.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">Certifications</h4>
          <ul className="space-y-1">
            {parsed.certifications.map((cert, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
