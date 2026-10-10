
                /** @type import('wuchale').CompiledElement[] */
export let c = ["Login failed.","Check your email inbox.","Server unavailable.","Create account","Send recovery link","Sign in","Join KSI","Recover access","Welcome to KSI",[0," — KSI"],"Change language",["KSI",[0,"/ core"]],"One account. Every KSI project and conversation.","Account options","Remembered accounts","Forget account","Forget","Continue with GitHub","Continue with Google","G","Full name","Anna Kowalska","E-mail","Password","Forgot password","Remember account on this device","Please wait…","Back to sign in","New accounts require activation by the KSI board.","Back to KSI","University of Wrocław","Source",["KSI · ",0],["v",0],"Password changed. You can sign in now.","New password","Choose a new password for your KSI account.","Recovery link missing. Request a new link on the sign-in page.","Saving…","Save password"]
                // only during dev, for HMR
                let latestVersion = -1
                // @ts-ignore
                export function update({ version, data }) {
                    if (latestVersion >= version) {
                        return
                    }
                    for (const [ index, item ] of data['pl'] ?? []) {
                        c[index] = item
                    }
                    latestVersion = version
                }
            