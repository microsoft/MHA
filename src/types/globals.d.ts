// Global type declarations - ultra permissive for JS-style code

declare global {
  // Allow function redeclaration
  var module: any;
  var exports: any;
  interface Window {
    [key: string]: any;
    analyzeHeaders?: () => void;
    clearHeaders?: () => void;
  }

  // All possible globals as any
  var $: any;
  var jQuery: any;
  var Office: {
    initialize: (reason?: any) => void;
    context: {
      mailbox: any;
      ui: any;
      platform: any;
      requirements: any;
    };
    MailboxEnums: any;
  } & any;
  var StackTrace: any;
  var myMSALObj: any;
  var xhr: any;
  var i: any;
  var mhaStrings: any;
  var mhaVersion: any;
  var getQueryVariable: any;
  var Configuration: any;
  var StandAlone: any;
  var Outlook16: any;
  var OutlookWeb: any;
  var buildVersion: any;
  var restVersion: any;
  var ewsVersion: any;
  var Headers: any;
  var HeaderValidationRules: any;
  var SummarySection: any;
  var Received: any;
  var OfficeMailbox: any;
  var Table: any;
  var debugInfo: any;
  var unittestonly: any;
  var fabric: any;
  var cptable: any;
  var appInsights: any;
  var Msal: any;
  var moment: any;
  var Framework7: any;
  var jwt_decode: any;

  // HTML onclick handler functions
  var analyzeHeaders: () => void;
  var clearHeaders: () => void;
}

// Allow module augmentation
declare module "*" {
  const content: any;
  export default content;
}

export {};