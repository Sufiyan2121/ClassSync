"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Camera, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Calendar, 
  Check, 
  Crop,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ImageCropModal } from "@/components/dashboard/ImageCropModal";
import toast from "react-hot-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { userData, updateUserProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [rawImageSrc, setRawImageSrc] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [gender, setGender] = useState("Male");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userData && isOpen) {
      setName(userData.displayName || "");
      setPhotoURL(userData.photoURL || "");
      setRawImageSrc("");
      setGender(userData.gender || "Male");
      setPhoneNumber(userData.phoneNumber || "");
      setBirthday(userData.birthday || "");
    }
  }, [userData, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCropModalOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCropModalOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image file is too large. Max 12MB allowed.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        setRawImageSrc(src);
        setIsCropModalOpen(true);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input so re-uploading the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setPhotoURL(croppedDataUrl);
    toast.success("Profile photo cropped!");
  };

  const handleRemovePhoto = () => {
    setPhotoURL("");
    setRawImageSrc("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Reverted to initial avatar");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: name.trim(),
        photoURL: photoURL.trim(),
        gender,
        phoneNumber: phoneNumber.trim(),
        birthday: birthday.trim(),
      });
      toast.success("Profile saved successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (name || userData?.displayName || "S").charAt(0).toUpperCase();

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overscroll-contain animate-in fade-in duration-200"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isCropModalOpen) onClose();
        }}
      >
        <div className="w-full max-w-lg bg-white dark:bg-[#0c1610] text-slate-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-[#1e3025] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1e3025] bg-slate-50/50 dark:bg-[#121c16]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                <User size={16} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                  Edit Profile
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-stone-400">Update your photo, phone, and details</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 hover:bg-slate-100 dark:hover:bg-[#1e3025] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-[#121c16] border border-stone-200/70 dark:border-[#1e3025]">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-700/20 ring-4 ring-white dark:ring-[#1e3025]">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                  title="Change Photo"
                >
                  <Camera size={14} />
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />

              {/* Photo Action Buttons */}
              <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                  >
                    {isUploading ? "Reading..." : "Upload Photo"}
                  </button>

                  {(rawImageSrc || photoURL) && (
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-800/80 transition-all cursor-pointer"
                    >
                      <Crop size={13} />
                      <span>Crop & Position</span>
                    </button>
                  )}

                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-stone-400 leading-relaxed">
                  Supports JPG, PNG, WebP. Position, zoom, and crop the image to fit your profile.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sufiyan Shaikh"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Protected) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-stone-300">
                    Email Address
                  </label>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-stone-400 bg-slate-100 dark:bg-[#16231b] px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-[#243a2c]">
                    <Lock size={10} />
                    <span>Google Account Verified</span>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={userData?.email || ""}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-[#121c16] border border-slate-200 dark:border-[#1e3025] text-sm font-semibold text-slate-500 dark:text-stone-400 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-stone-500 mt-1">
                  Your email is tied to your Google Sign-in and cannot be edited.
                </p>
              </div>

              {/* Gender Selection & Phone Number in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                  >
                    <option value="Male" className="dark:bg-[#121c16]">Male</option>
                    <option value="Female" className="dark:bg-[#121c16]">Female</option>
                    <option value="Other" className="dark:bg-[#121c16]">Other</option>
                    <option value="Prefer not to say" className="dark:bg-[#121c16]">Prefer not to say</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

              </div>

              {/* Birthday / Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Date of Birth (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Calendar size={15} />
                  </div>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-stone-100 dark:border-[#1e3025] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1e3025] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Interactive Image Cropper Modal */}
      {isCropModalOpen && (rawImageSrc || photoURL) && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawImageSrc || photoURL}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
