"use client";

import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Camera, 
  Trash2, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Globe 
} from "lucide-react";
import { 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Image states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Determine provider types
  const isGoogleUser = user?.providerData.some(p => p.providerId === "google.com") || false;
  const isAnonymous = user?.isAnonymous || false;

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
      setPhotoUrl(user.photoURL || "");
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Basic size validation (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg("A imagem selecionada é muito grande. O tamanho máximo permitido é de 3MB.");
        return;
      }

      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
      setIsPhotoRemoved(false);
      setErrorMsg("");
    }
  };

  // Remove photo preview
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoUrl("");
    setIsPhotoRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Save changes handler
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let finalPhotoUrl = user.photoURL || "";
      const isEmailChanged = email !== user.email;
      const isPasswordChanged = newPassword.length > 0;
      const isNameChanged = name !== user.displayName;

      // 1. Validations
      if (isPasswordChanged) {
        if (newPassword.length < 6) {
          throw new Error("A nova palavra-passe deve ter pelo menos 6 caracteres.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("A confirmação da nova palavra-passe não coincide.");
        }
      }

      // Re-authentication validation for sensitive ops
      if ((isEmailChanged || isPasswordChanged) && !isGoogleUser && !isAnonymous) {
        if (!currentPassword) {
          throw new Error("É necessário introduzir a palavra-passe atual para alterar o email ou a palavra-passe.");
        }
      }

      // 2. Re-authenticate if required
      if ((isEmailChanged || isPasswordChanged) && !isGoogleUser && !isAnonymous && user.email) {
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
        } catch (authErr: any) {
          console.error("Erro na reautenticação:", authErr);
          throw new Error("A palavra-passe atual está incorreta. Não foi possível autenticar.");
        }
      }

      // 3. Upload photo if selected
      if (photoFile) {
        try {
          const storageRef = ref(storage, `profile_pictures/${user.uid}`);
          const uploadResult = await uploadBytes(storageRef, photoFile);
          finalPhotoUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageErr) {
          console.error("Erro no Firebase Storage:", storageErr);
          throw new Error("Falha ao carregar a imagem. Verifique a ligação ou tente novamente.");
        }
      } else if (isPhotoRemoved) {
        // If user wants to delete image
        finalPhotoUrl = "";
        try {
          const storageRef = ref(storage, `profile_pictures/${user.uid}`);
          await deleteObject(storageRef).catch(() => {
            // Ignore error if file doesn't exist in storage
          });
        } catch (e) {
          console.warn("Storage deletion warning:", e);
        }
      }

      // 4. Update Email
      if (isEmailChanged && !isGoogleUser && !isAnonymous) {
        await updateEmail(user, email);
      }

      // 5. Update Password
      if (isPasswordChanged && !isGoogleUser && !isAnonymous) {
        await updatePassword(user, newPassword);
      }

      // 6. Update Profile Info (Name and PhotoURL)
      if (isNameChanged || finalPhotoUrl !== user.photoURL || isPhotoRemoved) {
        await updateProfile(user, {
          displayName: name.trim() || null,
          photoURL: finalPhotoUrl || null
        });
      }

      setSuccessMsg("Perfil atualizado com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPhotoFile(null);
      
      // Force reload auth state from Firebase
      router.refresh();
    } catch (err: any) {
      console.error("Erro ao guardar alterações:", err);
      setErrorMsg(err.message || "Ocorreu um erro ao atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-stone-50 text-stone-800 flex flex-col relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center">
              <div className="flex items-center gap-3">
                <Link 
                  href="/"
                  className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  title="Voltar ao início"
                >
                  <ArrowLeft className="h-6 w-6" />
                  <span className="text-sm font-bold hidden sm:inline">Voltar ao Mapa</span>
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-stone-900 tracking-tight italic">Explorer</span>
                <div className="bg-stone-950 p-2 rounded-xl shadow-lg">
                  <Globe className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex justify-center py-10 px-4">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-stone-200 shadow-xl p-8 sm:p-12 relative">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-stone-900 tracking-tight">Editar Perfil</h1>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mt-1">Gere a tua identidade de viajante</p>
            </div>

            {/* Notification Messages */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-100 text-orange-700 rounded-2xl flex items-start gap-3 text-sm font-semibold">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}
            
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 rounded-2xl flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            {isAnonymous && (
              <div className="mb-8 p-4 bg-yellow-50 border-2 border-yellow-100 text-yellow-800 rounded-2xl flex items-start gap-3 text-xs font-bold uppercase tracking-wide">
                <ShieldAlert className="h-5 w-5 text-yellow-600 shrink-0" />
                <div>
                  <p>Modo de Convidado Ativo</p>
                  <p className="text-[10px] text-stone-400 mt-1 uppercase font-semibold">
                    Para alterar o email ou palavra-passe, deves registar uma conta completa.
                  </p>
                </div>
              </div>
            )}

            {isGoogleUser && (
              <div className="mb-8 p-4 bg-stone-50 border-2 border-stone-100 text-stone-700 rounded-2xl flex items-start gap-3 text-xs font-bold uppercase tracking-wide">
                <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p>Autenticado com conta Google</p>
                  <p className="text-[10px] text-stone-400 mt-1 uppercase font-semibold">
                    O teu email e palavra-passe são geridos externamente pelo Google.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveChanges} className="space-y-8">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-stone-100">
                <div className="relative group">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Foto de perfil" 
                      className="h-28 w-28 rounded-full object-cover border-2 border-stone-200 shadow-md"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-stone-100 border-2 border-stone-200 flex items-center justify-center text-stone-400 shadow-inner">
                      <UserIcon className="h-12 w-12" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 p-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 shadow-md transition-colors cursor-pointer"
                    title="Alterar fotografia"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-xs font-black uppercase tracking-widest text-stone-400">Fotografia de Perfil</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      Alterar Foto
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-4 py-2 bg-white hover:bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 font-bold">Formatos suportados: JPG, PNG. Tamanho máx. 3MB.</p>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Escreve o teu nome de viajante..."
                    className="w-full px-5 py-4 bg-stone-50 hover:bg-white border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-2xl transition-all outline-none font-bold text-stone-850"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Endereço de Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-stone-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      disabled={isGoogleUser || isAnonymous}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-12 pr-5 py-4 bg-stone-50 hover:bg-white disabled:bg-stone-100 disabled:text-stone-400 disabled:hover:bg-stone-100 border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-2xl transition-all outline-none font-bold text-stone-850"
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              {!isGoogleUser && !isAnonymous && (
                <div className="pt-6 border-t border-stone-100 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-50 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-stone-400" />
                    Alterar Palavra-passe
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Nova Palavra-passe</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-5 py-4 bg-stone-50 hover:bg-white border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-2xl transition-all outline-none font-bold text-stone-850"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Confirmar Nova Palavra-passe</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma a nova palavra-passe"
                        className="w-full px-5 py-4 bg-stone-50 hover:bg-white border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-2xl transition-all outline-none font-bold text-stone-850"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Re-authentication required message & current password field */}
              {(email !== user?.email || newPassword.length > 0) && !isGoogleUser && !isAnonymous && (
                <div className="pt-6 border-t border-stone-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-stone-800">Confirmação de Segurança Necessária</p>
                      <p className="text-[10px] text-stone-400 font-medium mt-1 leading-relaxed">
                        Para alterares o email ou palavra-passe, deves reautenticar-te introduzindo a tua palavra-passe atual para proteger a tua conta.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Palavra-passe Atual</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Introduz a tua palavra-passe atual..."
                      className="w-full px-5 py-4 bg-stone-50 hover:bg-white border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-2xl transition-all outline-none font-bold text-stone-850"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-stone-900 text-stone-50 hover:bg-stone-800 py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:bg-stone-300 shadow-xl shadow-stone-200 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      A Guardar...
                    </>
                  ) : (
                    "Guardar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
