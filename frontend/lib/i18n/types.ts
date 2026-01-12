export type Locale = 'zh' | 'en';

export interface Translations {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    confirm: string;
    settings: string;
    logout: string;
    login: string;
    register: string;
    email: string;
    password: string;
    submit: string;
  };
  home: {
    title: string;
    subtitle: string;
    description: string;
    loginBtn: string;
    registerBtn: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loggingIn: string;
    registering: string;
    noAccount: string;
    hasAccount: string;
    loginFailed: string;
    registerFailed: string;
  };
  documents: {
    title: string;
    upload: string;
    uploading: string;
    empty: string;
    deleteConfirm: string;
    uploadFailed: string;
    deleteFailed: string;
  };
  editor: {
    save: string;
    saving: string;
    download: string;
    downloading: string;
    chat: string;
    preview: string;
    edit: string;
    loadingPreview: string;
    saveFailed: string;
    downloadFailed: string;
  };
  chat: {
    title: string;
    placeholder: string;
    send: string;
    noApiKey: string;
    goToSettings: string;
    selectApiKey: string;
    thinking: string;
  };
  aiToolbar: {
    title: string;
    polish: string;
    expand: string;
    summarize: string;
  };
  settings: {
    title: string;
    apiKeys: string;
    addKey: string;
    editKey: string;
    name: string;
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    test: string;
    testing: string;
    testSuccess: string;
    testFailed: string;
    noKeys: string;
    back: string;
  };
  language: {
    zh: string;
    en: string;
    switch: string;
  };
}

export type TranslationKey = string;
