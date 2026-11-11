/**
 * The admin app is single-language by design (operators, not visitors), so
 * its copy lives in one typed object instead of a translation layer. If a
 * project needs a localised admin, lift the web app's next-intl setup over.
 */
export const TEXTS = {
  appName: "Admin",
  nav: {
    overview: "Overview",
    // example-domain:start
    examples: "Examples",
    // example-domain:end
    settings: "Settings",
    signOut: "Sign out",
    account: "Account",
  },
  auth: {
    signInTitle: "Sign in to the admin",
    signInSubtitle: "Use your operator account.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    forgotLink: "Forgot password?",
    forgotTitle: "Reset your password",
    forgotSubtitle: "We will email you a reset link.",
    forgotSent: "If that email exists, a reset link is on its way.",
    submitForgot: "Send reset link",
    backToSignIn: "Back to sign in",
    resetTitle: "Choose a new password",
    resetSubtitle: "Enter the new password for your operator account.",
    resetToken: "Reset token",
    newPassword: "New password",
    passwordConfirmation: "Confirm new password",
    submitReset: "Set new password",
    sessionExpired: "Your session has expired. Sign in again.",
    signedOut: "You have been signed out.",
    mockHint: "Mock API account: admin@example.com / password",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  overview: {
    title: "Overview",
    subtitle: "Replace these cards with the project's own metrics.",
    welcome: "Signed in as {name}",
    cards: {
      // example-domain:start
      examples: "Examples",
      // example-domain:end
      session: "Session",
      permissions: "Permissions",
      none: "None known",
    },
  },
  // example-domain:start
  examples: {
    title: "Examples",
    subtitle:
      "A reference CRUD screen over the example domain. Remove with npm run example:remove.",
    newButton: "New example",
    search: "Search examples",
    columns: { title: "Title", status: "Status", created: "Created", actions: "Actions" },
    empty: "No examples yet.",
    loadError: "The examples could not be loaded.",
    edit: "Edit",
    delete: "Delete",
    deleteConfirmTitle: "Delete this example?",
    deleteConfirmBody: "This cannot be undone.",
    created: "Example created.",
    updated: "Example updated.",
    deleted: "Example deleted.",
    form: {
      createTitle: "New example",
      editTitle: "Edit example",
      title: "Title",
      description: "Description",
      status: "Status",
      save: "Save",
      cancel: "Cancel",
    },
    statuses: { draft: "Draft", active: "Active", archived: "Archived" },
    pageOf: "Page {page} of {total}",
    previous: "Previous",
    next: "Next",
  },
  // example-domain:end
  settings: {
    title: "Settings",
    subtitle: "A placeholder for project settings screens.",
  },
  common: {
    retry: "Try again",
    loading: "Loading…",
    somethingWentWrong: "Something went wrong. Please try again.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you are looking for does not exist.",
    goHome: "Go to the overview",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    forbidden: "You do not have access to this page.",
  },
} as const;

/** Fills `{name}`-style tokens in a text. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
