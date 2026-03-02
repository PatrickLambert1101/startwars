const en = {
  common: {
    ok: "OK",
    cancel: "Cancel",
    back: "Back",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    logOut: "Sign Out",
  },
  errors: {
    invalidEmail: "Invalid email address.",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "An unexpected error occurred. Please try restarting the app. If the problem persists, contact support.",
    reset: "RESET APP",
    traceTitle: "Error from %{name} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "Nothing here yet",
      content: "No data found. Add some records to get started.",
      button: "Refresh",
    },
  },
}

export default en
export type Translations = typeof en
