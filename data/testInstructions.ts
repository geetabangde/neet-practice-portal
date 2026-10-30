import type { InstructionGroup } from "@/types/dashboard";

// Instruction text copied from the Figma design. The brand name is HN QBank.

export const generalInstructions: InstructionGroup[] = [
  {
    heading: "General Instructions:",
    start: 1,
    items: [
      { text: "Total duration of National NEET-PG Mock 2026 (New NEET Pattern) is 210 minutes." },
      {
        text: "The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:",
        palette: true,
      },
      {
        text: [
          { text: "The Marked for Review status for a question simply indicates that you would like to look at that question again. " },
          { text: "If an answer is selected for a question that is Marked for Review, the answer will be considered in the final evaluation.", bold: true },
        ],
      },
    ],
  },
  {
    heading: "Parts:",
    start: 4,
    items: [
      { text: "This test is divided into 5 parts – Part A, B, C, D & E.", bold: true },
      { text: "Each part will have 36 questions and is allotted 42 minutes.", bold: true },
      { text: "You cannot proceed to the next part until you complete the 42 minutes of the previous part.", bold: true },
      { text: "The next part will start automatically after the completion of the previous part.", bold: true },
      { text: "You cannot review/modify your responses for a part after you complete the allotted time.", bold: true },
      { text: "The test will be auto submitted after 210 minutes.", bold: true },
      { text: "You cannot use multiple devices to take this test.", bold: true },
    ],
  },
  {
    heading: "Navigating to a Question:",
    start: 11,
    items: [
      {
        text: "To answer a question, do the following:",
        bullets: [
          "Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.",
          "Click on Save & Next to save your answer for the current question and then go to the next question.",
          "Click on Mark for Review & Next to mark your question for review, and then go to the next question.",
        ],
      },
      {
        text: "You can view all the questions by clicking on the Question Paper button. Note that the options for multiple choice type questions will not be shown.",
      },
    ],
  },
  {
    heading: "Answering a Question :",
    start: 13,
    items: [
      {
        text: "Procedure for answering a multiple choice type question:",
        bullets: [
          "To select your answer, click on the button of one of the options",
          "To deselect your chosen answer, click on the button of the chosen option again or click on the Clear Response button",
          "To change your chosen answer, click on the button of another option",
          "To save your answer, you MUST click on the Save & Next button",
          [
            { text: "To mark the question for review, click on the Mark for Review & Next button. " },
            { text: "If an answer is selected for a question that is Marked for Review, the answer will be considered in the final evaluation.", bold: true },
          ],
        ],
      },
      {
        text: "To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering of question as indicated above.",
      },
      {
        text: "Note that ONLY Questions for which answers are saved after answering will be considered for evaluation. This will also include questions that have been answered and marked for review.",
      },
    ],
  },
];

// Colour legend shown under item 2 of the general instructions
export const paletteLegend = [
  { className: "bg-[#9e9e9e]", label: "This question has not been visited yet." },
  { className: "bg-[#ff4444]", label: "This question has been visited, but not answered." },
  { className: "bg-[#2fd36a]", label: "This question has been answered and will be considered for evaluation." },
  { className: "bg-[#6b3fa0]", label: "This question has been marked for review and has not been answered." },
  {
    className: "bg-[#6b3fa0]",
    label: "This question has been answered and marked for review, which will be considered for evaluation.",
    badge: true,
  },
];

export const otherInstructions: InstructionGroup[] = [
  {
    heading: "Instructions for Mock Test",
    start: 1,
    items: [
      {
        text: "This is a Mock test. The Questions displayed are for practice purpose only. Under no circumstances should this be presumed as sample questions.",
      },
      {
        text: "Mock test is meant for creating awareness about the test delivery system. Contents are for sample only and actual content will be different on the day of examination.",
      },
    ],
  },
  {
    heading: "Some important instructions for the exam are as follows:",
    start: 1,
    items: [
      {
        text: "Pen, Pencil, Cell phones, pagers, calculators, Pen Drives, Tablets or any electronic devices are strictly prohibited. Violation will lead to expulsion from the examination. No arrangements have been made at the exam centres for their custody. Candidates are advised not to bring them at the exam centre.",
      },
      {
        text: "Improper conduct will entail expulsion from the examination. Failure to comply with the instructions will entail expulsion/cancellation of candidature including appropriate legal action.",
      },
      { text: "Follow the instruction given before or after any screen during the computer based exam." },
      {
        text: "Use of keyboard during the exam is strictly prohibited. Wherever use of keyboard is needed a virtual keyboard will appear on screen automatically.",
      },
      { text: "Always maintain peace, discipline and silence during the examination process." },
      {
        text: "NBE reserves all rights to verify identity and genuineness of each candidate at the exam centre by taking thumb impression and photograph of the candidate or by any other means.",
      },
      { text: "Late entry and/or early exit is not permitted." },
      { text: "Please read the information bulletin carefully." },
    ],
  },
];

export const ndaTitle = "NON DISCLOSURE AGREEMENT (HN QBANK)";

export const ndaParagraphs = [
  "This test is confidential and proprietary. HN QBank expressly prohibits you from disclosing, publishing, reproducing or transmitting this test, in whole or in part, in any form or by any means verbal or written, electronic or mechanical and for any purpose.",
  "No content of this test must be shared with friends, acquaintances or third parties including sharing through online means or via social media. Social media includes but not limited to SMS, WhatsApp, Facebook, Twitter, Hangouts, Blogs etc. using either one's own account or proxy account(s).",
  "Any violation of the same shall be liable for penal action as per the HN QBank guidelines.",
];
