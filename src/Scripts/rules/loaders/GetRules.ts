export let AlreadyRetrievedRules = false;

// Use objects to avoid binding issues with let exports
export const RuleStore = {
    SimpleRuleSet: [],
    AndRuleSet: []
};

// For backward compatibility, also export direct references
export const SimpleRuleSet = RuleStore.SimpleRuleSet;
export const AndRuleSet = RuleStore.AndRuleSet;

// Get Rules function loads validation rules from local JSON file
// This replaces the previous server-based approach with a simple local file load
// All rule processing logic remains the same, only the source has changed
export function GetRules(doOnCompletion?, doWhileStillRunning?) {

    console.log("🔍 GetRules: ⚡ Starting rules loading from local file");
    console.log("🔍 GetRules: 📁 Loading rules from src/data/rules.json");
    console.log("🔍 GetRules: AlreadyRetrievedRules:", AlreadyRetrievedRules);

    if (AlreadyRetrievedRules === false) {
        console.log("🔍 GetRules: First time loading rules from local file");
        AlreadyRetrievedRules = true;

        // Call progress callback if provided
        if (doWhileStillRunning) {
            console.log("🔍 GetRules: Calling progress callback");
            doWhileStillRunning();
        }

        // Load rules from local JSON file
        loadLocalRules();
    } else {
        console.log("🔍 GetRules: Rules already loaded, calling completion handler");
        if (doOnCompletion) {
            doOnCompletion();
        }
    }

    // Load rules from local JSON file
    async function loadLocalRules() {
        try {
            console.log("🔍 GetRules: loadLocalRules - Loading from local JSON file");

            // Fetch the rules data (webpack will handle this at build time)
            const response = await fetch("/Pages/data/rules.json");

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rulesResponse = await response.json();

            console.log("🔍 GetRules: loadLocalRules - ✅ Rules loaded successfully");
            console.log("🔍 GetRules: loadLocalRules - Response:", {
                isError: rulesResponse.IsError,
                simpleRulesCount: rulesResponse.SimpleRules?.length || 0,
                andRulesCount: rulesResponse.AndRules?.length || 0,
                message: rulesResponse.Message
            });

            if (!rulesResponse.IsError) {
                console.log("🔍 GetRules: loadLocalRules - ✅ SUCCESS - Rules received!");
                console.log("🔍 GetRules: loadLocalRules - SimpleRules:", rulesResponse.SimpleRules?.length || 0, "rules");
                console.log("🔍 GetRules: loadLocalRules - AndRules:", rulesResponse.AndRules?.length || 0, "rules");

                // Update the arrays in place to maintain references
                RuleStore.SimpleRuleSet.length = 0; // Clear existing
                RuleStore.SimpleRuleSet.push(...rulesResponse.SimpleRules);
                RuleStore.AndRuleSet.length = 0; // Clear existing
                RuleStore.AndRuleSet.push(...rulesResponse.AndRules);

                console.log("🔍 GetRules: ✅ Rules successfully stored in global variables");
                console.log("🔍 GetRules: Final SimpleRuleSet length:", RuleStore.SimpleRuleSet?.length || 0);
                console.log("🔍 GetRules: Final AndRuleSet length:", RuleStore.AndRuleSet?.length || 0);

            } else {
                console.log("🔍 GetRules: loadLocalRules - ❌ Service returned error:", rulesResponse.Message);
                showMessage("Rules error", rulesResponse.Message || "Failed to load rules");
            }
        } catch (e) {
            console.log("🔍 GetRules: loadLocalRules - ❌ LOAD ERROR:", e);
            showMessage("Load error", "Could not load rules from local file: " + e.message);
        }

        console.log("🔍 GetRules: loadLocalRules - Calling completion handler");
        if (doOnCompletion) {
            doOnCompletion();
        }
    }

    // Displays an error message
    function showMessage(title: string, message: string) {
        const text = "GetRules - " + title + ":\n" + message;
        console.log(text);
    }
}