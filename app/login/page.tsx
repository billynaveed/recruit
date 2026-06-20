import { GoogleSigninButton } from "@/components/google-signin-button";
import { ADMIN_HOSTED_DOMAIN } from "@/lib/admin-domain";
import { APP_NAME, ORG_NAME } from "@/lib/site-config";

export default function LoginPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yfs-blue rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">{APP_NAME.charAt(0)}</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">{APP_NAME}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-center text-sm font-medium text-slate-900 mb-1">
            Sign in to access the recruitment dashboard
          </p>
          <p className="text-center text-xs text-slate-500 mb-5">
            Use your @{ADMIN_HOSTED_DOMAIN} account
          </p>

          {googleClientId ? (
            <GoogleSigninButton clientId={googleClientId} />
          ) : (
            <p className="text-center text-xs text-red-600">
              Google sign-in is not configured. Contact an administrator.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          {ORG_NAME} internal tool
        </p>
      </div>
    </div>
  );
}
