import { HeaderModel } from "../HeaderModel";

// Polyfill missing TextEncoder - https://stackoverflow.com/questions/68468203/why-am-i-getting-textencoder-is-not-defined-in-jest
// TODO: Move this to a global setup file
import { TextEncoder, TextDecoder } from "util";
Object.assign(global, { TextDecoder, TextEncoder }); // eslint-disable-line @typescript-eslint/naming-convention

describe("GetHeaderList Tests", () => {
    const headers = new HeaderModel();
    test("h1", () => {
        const headerList = headers.getHeaderList(
            "Subject: =?UTF-8?B?8J+PiCAgMjAxOSdzIE5vLjEgUmVjcnVpdCwgVGhlIFdvcmxkJ3Mg?=\n" +
            " =?UTF 8?B?VGFsbGVzdCBUZWVuYWdlciwgVG9wIFBsYXlzIG9mIHRoZSBXZWVrICYgbW9y?=\n" +
            " =?UTF-8?B?ZQ==?=\n" +
            "Date: Fri, 26 Jan 2018 15:54:11 - 0600\n");
        expect(headerList).toEqual([
            {
                "header": "Subject",
                "value": "🏈  2019's No.1 Recruit, The World's Tallest Teenager, Top Plays of the Week & more"
            },
            {
                "header": "Date",
                "value": "Fri, 26 Jan 2018 15:54:11 - 0600"
            }
        ]);
    });

    test("h2", () => {
        const headerList = headers.getHeaderList(
            "X-Microsoft-Antispam-Mailbox-Delivery:\n" +
            "\tabwl:0;wl:0;pcwl:0;kl:0;iwl:0;ijl:0;dwl:0;dkl:0;rwl:0;ex:0;auth:1;dest:I;ENG:(400001000128)(400125000095)(5062000261)(5061607266)(5061608174)(4900095)(4920089)(6250004)(4950112)(4990090)(400001001318)(400125100095)(61617190)(400001002128)(400125200095);");
        expect(headerList).toEqual([
            {
                "header": "X-Microsoft-Antispam-Mailbox-Delivery",
                "value": "abwl:0;wl:0;pcwl:0;kl:0;iwl:0;ijl:0;dwl:0;dkl:0;rwl:0;ex:0;auth:1;dest:I;ENG:(400001000128)(400125000095)(5062000261)(5061607266)(5061608174)(4900095)(4920089)(6250004)(4950112)(4990090)(400001001318)(400125100095)(61617190)(400001002128)(400125200095);"
            }
        ]);
    });

    test("h3", () => {
        const headerList = headers.getHeaderList(
            "Content-Type: multipart/alternative;\n" +
            "\tboundary=\"ErclWH56b6W5=_?:\"");
        expect(headerList).toEqual([
            {
                "header": "Content-Type",
                "value": "multipart/alternative; boundary=\"ErclWH56b6W5=_?:\""
            }
        ]);
    });
});
