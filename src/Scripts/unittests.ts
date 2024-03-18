import * as QUnit from "qunit";
import "qunit/qunit/qunit.css";
import "../Content/unittest.css";
import "framework7/dist/css/framework7.ios.min.css";
import "framework7/dist/css/framework7.ios.colors.min.css";
import "framework7-icons/css/framework7-icons.css";

import "./unittests/ut-common";
import "./unittests/ut-2047";
import "./unittests/ut-antispam";
import "./unittests/ut-DateTime";
import "./unittests/ut-GetHeaderList";
import "./unittests/ut-Received";
import "./unittests/ut-ParseError";
import "./unittests/ut-parseHeaders";
import "./unittests/ut-XML";

QUnit.start();
