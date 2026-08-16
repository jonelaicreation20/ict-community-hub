/**
 * The Quarter 1 module manifest.
 *
 * Titles and codes were read out of the PDFs themselves. Note that the file
 * names encode the *lesson* number, not a running count: `M12.pdf` is
 * "Module 1.2", and `M41`–`M43` are "Module 4.1"–"4.3". Sorting by file name
 * would therefore put 1.2 after 11, so `order` fixes the curriculum sequence.
 *
 * `E.pdf` is deliberately absent: it is a Grade 8 English worksheet on logical
 * connectors, not an Empowerment Technologies module.
 */
export type Module = {
  slug: string;
  code: string;
  title: string;
  file: string;
  /** Bytes, used for the offline download estimate. */
  bytes: number;
  /** Slug of the quiz that covers this module, when one exists. */
  quiz?: string;
};

export const MODULES: Module[] = [
  { slug: "m1", code: "1.1", title: "ICT and Its Current State", file: "M1.pdf", bytes: 357166, quiz: "m1" },
  { slug: "m12", code: "1.2", title: "Software Application and Platforms", file: "M12.pdf", bytes: 372359, quiz: "m12" },
  { slug: "m2", code: "2", title: "Netiquettes", file: "M2.pdf", bytes: 310977, quiz: "m2" },
  { slug: "m3", code: "3", title: "Online Navigation", file: "M3.pdf", bytes: 405944 },
  { slug: "m41", code: "4.1", title: "Applied Productivity Tools using Word Processor", file: "M41.pdf", bytes: 564600 },
  { slug: "m42", code: "4.2", title: "Applied Productivity Tools using Spreadsheet", file: "M42.pdf", bytes: 878867 },
  { slug: "m43", code: "4.3", title: "Applied Productivity Tools using Slides", file: "M43.pdf", bytes: 540343 },
  { slug: "m5", code: "5", title: "Imaging and Design for the Online Environment", file: "M5.pdf", bytes: 601342 },
  { slug: "m6", code: "6", title: "Imaging and Design for Visual Message Using Infographics", file: "M6.pdf", bytes: 612080 },
  { slug: "m7", code: "7", title: "Imaging and Design for Basic Image Manipulation", file: "M7.pdf", bytes: 539047 },
  { slug: "m8", code: "8", title: "Online Creation Tools, Platforms and Applications", file: "M8.pdf", bytes: 461194 },
  { slug: "m9", code: "9", title: "Web Page Designing", file: "M9.pdf", bytes: 461768 },
  { slug: "m10", code: "10", title: "Web Page Design Using Templates and WYSIWYG Platforms", file: "M10.pdf", bytes: 440017 },
  { slug: "m11", code: "11", title: "Collaborative Development of ICT Content", file: "M11.pdf", bytes: 682454 },
];

export const modulePath = (m: Module) => `/assets/${m.file}`;

export const getModule = (slug: string) => MODULES.find((m) => m.slug === slug);

export const formatMB = (bytes: number) => `${(bytes / 1_000_000).toFixed(2)} MB`;

export const TOTAL_BYTES = MODULES.reduce((sum, m) => sum + m.bytes, 0);
