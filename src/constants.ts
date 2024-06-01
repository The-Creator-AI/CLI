export const PRE_PROMPT_FILE = 'system-instruction.llm';
export const POST_PROMPT_FILE = 'prompt.llm';
export const OUTPUT_FILE = 'content.llm';
export const LLM_RESPONSE_FILE = 'llm-response.llm';
export const DIFF_PATCH_FILE = 'diff.patch';
export const CUSTOM_PROMPTS_FILE = 'custom-prompts.llm';
export const COMPLETE_DIFF_REQUEST = `The diff you provided is correct but it is not complete. Please provide the rest of the changes. Are you sure you have covered all the required files? Functions? etc.`;
export const BETTERS_DIFF_REQUEST = `The diff seems to be corrupted, please provide the correct diff again.`;
export const DEFAULT_PRE_PROMPT = `I'd like to make some changes to my codebase, and I'd appreciate your help.

Instead of providing one long text with all the files, can we break it down by specific changes?

Here's what I propose:**

Describe the change: Briefly explain what you want to achieve with the code modification.
Desired outcome: Describe the expected behavior after the change.
Once you understand my goals, you can provide the modified code in the git diff format.
To help you with git diff, I have added line numbers to the code.
Remember, line numbers are to be excluded from the diff. Treat the code as if there were no line numbers.

Example:
You will see the code as -
\`\`\`
1. #include <stdio.h>
2. #include <stdlib.h>
3. #include <string.h>
4. 
5. int main() {
6.     printf("Hello, World!\n");
7.     return 0;
8. }
\`\`\`
When you return git diff, you will give the following output:
--- a/main.c
+++ b/main.c
@@ -1,5 +1,5 @@
- #include <stdio.h>
+ #include <stdio.h>
+ #include <stdlib.h>
+ #include <string.h>
 
- int main() {
+ int main() {
     printf("Hello, World!\n");
     return 0;
 }



I hope that helps.


This approach will allow us to work more efficiently and ensure we're on the same page.
`;
export const DEFAULT_POST_PROMPT = `Give the outline of the project.`;
// I would like to refactor index.ts, I guess things can be moved to remote.ts
export const REQUEST_SPEC_DOC = `
Instead of making the changes, create a spec document in docs folder.
Name it index-refactor-<date-time>.md, and explain the changes you'll make.
Try avoiding writing actual code in this file, but ensure to write which files/functions need 
to be changed. Also, what exactly to be modified in those function, epxlain in natural language.
`;
export const IGNORE_LINE_NUMBERS = `Remember, line numbers are to be excluded from the diff. Treat the code as if there were no line numbers.`;
export const BINARY_EXTENSTIONS = [
    "3dm",
    "3ds",
    "3g2",
    "3gp",
    "7z",
    "a",
    "aac",
    "adp",
    "afdesign",
    "afphoto",
    "afpub",
    "ai",
    "aif",
    "aiff",
    "alz",
    "ape",
    "apk",
    "appimage",
    "ar",
    "arj",
    "asf",
    "au",
    "avi",
    "bak",
    "baml",
    "bh",
    "bin",
    "bk",
    "bmp",
    "btif",
    "bz2",
    "bzip2",
    "cab",
    "caf",
    "cgm",
    "class",
    "cmx",
    "cpio",
    "cr2",
    "cur",
    "dat",
    "dcm",
    "deb",
    "dex",
    "djvu",
    "dll",
    "dmg",
    "dng",
    "doc",
    "docm",
    "docx",
    "dot",
    "dotm",
    "dra",
    "DS_Store",
    "dsk",
    "dts",
    "dtshd",
    "dvb",
    "dwg",
    "dxf",
    "ecelp4800",
    "ecelp7470",
    "ecelp9600",
    "egg",
    "eol",
    "eot",
    "epub",
    "exe",
    "f4v",
    "fbs",
    "fh",
    "fla",
    "flac",
    "flatpak",
    "fli",
    "flv",
    "fpx",
    "fst",
    "fvt",
    "g3",
    "gh",
    "gif",
    "graffle",
    "gz",
    "gzip",
    "h261",
    "h263",
    "h264",
    "icns",
    "ico",
    "ief",
    "img",
    "ipa",
    "iso",
    "jar",
    "jpeg",
    "jpg",
    "jpgv",
    "jpm",
    "jxr",
    "key",
    "ktx",
    "lha",
    "lib",
    "lvp",
    "lz",
    "lzh",
    "lzma",
    "lzo",
    "m3u",
    "m4a",
    "m4v",
    "mar",
    "mdi",
    "mht",
    "mid",
    "midi",
    "mj2",
    "mka",
    "mkv",
    "mmr",
    "mng",
    "mobi",
    "mov",
    "movie",
    "mp3",
    "mp4",
    "mp4a",
    "mpeg",
    "mpg",
    "mpga",
    "mxu",
    "nef",
    "npx",
    "numbers",
    "nupkg",
    "o",
    "odp",
    "ods",
    "odt",
    "oga",
    "ogg",
    "ogv",
    "otf",
    "ott",
    "pages",
    "pbm",
    "pcx",
    "pdb",
    "pdf",
    "pea",
    "pgm",
    "pic",
    "png",
    "pnm",
    "pot",
    "potm",
    "potx",
    "ppa",
    "ppam",
    "ppm",
    "pps",
    "ppsm",
    "ppsx",
    "ppt",
    "pptm",
    "pptx",
    "psd",
    "pya",
    "pyc",
    "pyo",
    "pyv",
    "qt",
    "rar",
    "ras",
    "raw",
    "resources",
    "rgb",
    "rip",
    "rlc",
    "rmf",
    "rmvb",
    "rpm",
    "rtf",
    "rz",
    "s3m",
    "s7z",
    "scpt",
    "sgi",
    "shar",
    "snap",
    "sil",
    "sketch",
    "slk",
    "smv",
    "snk",
    "so",
    "stl",
    "suo",
    "sub",
    "swf",
    "tar",
    "tbz",
    "tbz2",
    "tga",
    "tgz",
    "thmx",
    "tif",
    "tiff",
    "tlz",
    "ttc",
    "ttf",
    "txz",
    "udf",
    "uvh",
    "uvi",
    "uvm",
    "uvp",
    "uvs",
    "uvu",
    "viv",
    "vob",
    "war",
    "wav",
    "wax",
    "wbmp",
    "wdp",
    "weba",
    "webm",
    "webp",
    "whl",
    "wim",
    "wm",
    "wma",
    "wmv",
    "wmx",
    "woff",
    "woff2",
    "wrm",
    "wvx",
    "xbm",
    "xif",
    "xla",
    "xlam",
    "xls",
    "xlsb",
    "xlsm",
    "xlsx",
    "xlt",
    "xltm",
    "xltx",
    "xm",
    "xmind",
    "xpi",
    "xpm",
    "xwd",
    "xz",
    "z",
    "zip",
    "zipx"
];
export const GENERATE_COMMIT_MSG = `Generate a few good commit messages for the change log below. Ensure to return array of objects with two keys - commit & description`;
export const SUGGEST_THINGS = `Analyse the code above and suggest me the changes that I could do. Give a list of thigns that can be done in the format string[]`;