/**
* @class English lip-sync processor
* @author Mika Suominen
*/

class LipsyncEn {

    /**
    * @constructor
    */
    constructor() {

        // English words to Oculus visemes, algorithmic rules adapted from:
        //   NRL Report 7948, "Automatic Translation of English Text to Phonetics by Means of Letter-to-Sound Rules" (1976)
        //   by HONEY SUE EL.OVITZ, RODNEY W. JOHNSON, ASTRID McHUGH, AND JOHN E. SHORE
        //   Available at: https://apps.dtic.mil/sti/pdfs/ADA021929.pdf
        this.rules = {
            'A': [
                "[A] =aa", " [AR] =aa RR", " [AL] =aa LL", " [ADO]=aa DD O", " [AMOS]=aa MM O SS"
            ],
            'B': [
                "[B] =PP", " [BA]=PP AA", " [BE]=PP E", " [BI]=PP I", " [BO]=PP O", " [BU]=PP U"
            ],
            'C': [
                "[C]A =kk AA", "[C]E =TH E", "[C]I =TH I", "[C]O =kk O", "[C]U =kk U", "[C]H =CH"
            ],
            'D': [
                "[D] =DD", " [DE]=DD E", " [DI]=DD I", " [DO]=DD O", " [DU]=DD U"
            ],
            'E': [
                "[E] =E", " [ES]=E SS", " [ER]=E RR", " [EL]=E LL"
            ],
            'F': [
                "[F] =FF", " [FA]=FF AA", " [FE]=FF E", " [FI]=FF I", " [FO]=FF O", " [FU]=FF U"
            ],
            'G': [
                "[G]A =kk AA", "[G]E =HH E", "[G]I =HH I", "[G]O =kk O", "[G]U =kk U", " [GUE]=kk E", " [GUI]=kk I"
            ],
            'H': [
                "[H] =", // H is silent in Spanish
            ],
            'I': [
                "[I] =I", " [IN]=I NN", " [IL]=I LL", " [ISTO]=I SS TT O"
            ],
            'J': [
                "[J] =HH", " [JA]=HH AA", " [JE]=HH E", " [JI]=HH I", " [JO]=HH O", " [JU]=HH U"
            ],
            'K': [
                "[K] =kk", " [KA]=kk AA", " [KE]=kk E", " [KI]=kk I", " [KO]=kk O", " [KU]=kk U"
            ],
            'L': [
                "[L] =LL", " [LA]=LL AA", " [LE]=LL E", " [LI]=LL I", " [LO]=LL O", " [LU]=LL U"
            ],
            'M': [
                "[M] =MM", " [MA]=MM AA", " [ME]=MM E", " [MI]=MM I", " [MO]=MM O", " [MU]=MM U"
            ],
            'N': [
                "[N] =NN", " [NA]=NN AA", " [NE]=NN E", " [NI]=NN I", " [NO]=NN O", " [NU]=NN U"
            ],
            'Ñ': [
                "[Ñ] =NN", " [ÑA]=NN AA", " [ÑE]=NN E", " [ÑI]=NN I", " [ÑO]=NN O", " [ÑU]=NN U"
            ],
            'O': [
                "[O] =O", " [OS]=O SS", " [OL]=O LL", " [OR]=O RR"
            ],
            'P': [
                "[P] =PP", " [PA]=PP AA", " [PE]=PP E", " [PI]=PP I", " [PO]=PP O", " [PU]=PP U"
            ],
            'Q': [
                "[Q]UE =kk E", "[Q]UI =kk I"
            ],
            'R': [
                "[R] =RR", " [RA]=RR AA", " [RE]=RR E", " [RI]=RR I", " [RO]=RR O", " [RU]=RR U", " [RR] =RRR"
            ],
            'S': [
                "[S] =SS", " [SA]=SS AA", " [SE]=SS E", " [SI]=SS I", " [SO]=SS O", " [SU]=SS U"
            ],
            'T': [
                "[T] =TT", " [TA]=TT AA", " [TE]=TT E", " [TI]=TT I", " [TO]=TT O", " [TU]=TT U"
            ],
            'U': [
                "[U] =U", " [UL]=U LL", " [UN]=U NN", " [USTED]=U SS TT E DD"
            ],
            'V': [
                "[V] =FF", " [VA]=FF AA", " [VE]=FF E", " [VI]=FF I", " [VO]=FF O", " [VU]=FF U"
            ],
            'W': [
                "[W] =VV", " [WA]=VV AA", " [WE]=VV E", " [WI]=VV I", " [WO]=VV O", " [WU]=VV U"
            ],
            'X': [
                "[X] =SS", " [XA]=SS AA", " [XE]=SS E", " [XI]=SS I", " [XO]=SS O", " [XU]=SS U"
            ],
            'Y': [
                "[Y] =I", " [YA]=I AA", " [YE]=I E", " [YI]=I I", " [YO]=I O", " [YU]=I U"
            ],
            'Z': [
                "[Z] =TH", " [ZA]=TH AA", " [ZE]=TH E", " [ZI]=TH I", " [ZO]=TH O", " [ZU]=TH U"
            ]
        };

        this.ops = {
            '#': '[AEIOUaeiouáéíóúÁÉÍÓÚ]+',  // One or more vowels, including accented vowels
            '.': '[bdgjlmnrvwzBDGJLMNRVWZ]', // One voiced consonant
            '%': '(?:er|e|es|ed|iendo|ando|oso|osa)', // Common verb endings and adjective forms
            '&': '(?:s|c|g|z|x|j|ch|sh)',   // Matches sibilants and affricates
            '@': '(?:t|s|r|d|l|n|j|th|ch|sh)', // Matches vibrant and liquid consonants along with some fricatives
            '^': '[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]', // Matches any consonant
            '+': '[eiyEIYéíýÉÍÝ]',           // Matches E, I, Y, including accented forms
            ':': '[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]*', // Zero or more consonants
            ' ': '\\b'   // Word boundary
        };
        // Convert rules to regex
        Object.keys(this.rules).forEach(key => {
            this.rules[key] = this.rules[key].map(rule => {
                const posL = rule.indexOf('[');
                const posR = rule.indexOf(']');
                const posE = rule.indexOf('=');
                const strLeft = rule.substring(0, posL);
                const strLetters = rule.substring(posL + 1, posR);
                const strRight = rule.substring(posR + 1, posE);
                const strVisemes = rule.substring(posE + 1);

                const o = { regex: '', move: 0, visemes: [] };

                let exp = '';
                exp += [...strLeft].map(x => ops[x] || x).join('');
                const ctxLetters = [...strLetters];
                ctxLetters[0] = ctxLetters[0].toLowerCase();
                exp += ctxLetters.join('');
                o.move = ctxLetters.length;
                exp += [...strRight].map(x => ops[x] || x).join('');
                o.regex = new RegExp(exp);

                if (strVisemes.length) {
                    strVisemes.split(' ').forEach(viseme => {
                        o.visemes.push(viseme);
                    });
                }

                return o;
            });
        });

        // Viseme durations in relative unit (1=average)
        // TODO: Check for statistics for English
        this.visemeDurations = {
            'aa': 0.95, 'E': 0.90, 'I': 0.92, 'O': 0.96, 'U': 0.95, 'PP': 1.08,
            'SS': 1.23, 'TH': 1, 'DD': 1.05, 'FF': 1.00, 'kk': 1.21, 'nn': 0.88,
            'RR': 0.88, 'DD': 1.05, 'sil': 1
        };

        // Pauses in relative units (1=average)
        this.specialDurations = { ' ': 1, ',': 3, '-': 0.5 };

        // English number words
        this.digits = ['oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        this.ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        this.tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        this.teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

        // Symbols to English
        this.symbols = {
            '%': 'percent', '€': 'euros', '&': 'and', '+': 'plus',
            '$': 'dollars'
        };
        this.symbolsReg = /[%€&\+\$]/g;
    }

    convert_digit_by_digit(num) {
        num = String(num).split("");
        let numWords = "";
        for (let m = 0; m < num.length; m++) {
            numWords += this.digits[num[m]] + " ";
        }
        numWords = numWords.substring(0, numWords.length - 1); //kill final space
        return numWords;
    }

    convert_sets_of_two(num) {
        let firstNumHalf = String(num).substring(0, 2);
        let secondNumHalf = String(num).substring(2, 4);
        let numWords = this.convert_tens(firstNumHalf);
        numWords += " " + this.convert_tens(secondNumHalf);
        return numWords;
    }

    convert_millions(num) {
        if (num >= 1000000) {
            return this.convert_millions(Math.floor(num / 1000000)) + " million " + this.convert_thousands(num % 1000000);
        } else {
            return this.convert_thousands(num);
        }
    }

    convert_thousands(num) {
        if (num >= 1000) {
            return this.convert_hundreds(Math.floor(num / 1000)) + " thousand " + this.convert_hundreds(num % 1000);
        } else {
            return this.convert_hundreds(num);
        }
    }

    convert_hundreds(num) {
        if (num > 99) {
            return this.ones[Math.floor(num / 100)] + " hundred " + this.convert_tens(num % 100);
        } else {
            return this.convert_tens(num);
        }
    }

    convert_tens(num) {
        if (num < 10) return this.ones[num];
        else if (num >= 10 && num < 20) {
            return this.teens[num - 10];
        } else {
            return this.tens[Math.floor(num / 10)] + " " + this.ones[num % 10];
        }
    }

    convertNumberToWords(num) {
        if (num == 0) return "cero";
        let parts = [];
        let chunks = [
            { value: 1000000, singular: "millón", plural: "millones" },
            { value: 1000, singular: "mil", plural: "mil" },
            { value: 100, singular: "cien", plural: "cientos" },
            { value: 10, singular: "diez", plural: "decena" }
        ];
    
        chunks.forEach(chunk => {
            if (num >= chunk.value) {
                let count = Math.floor(num / chunk.value);
                num %= chunk.value;
                if (chunk.value == 100 && count == 1) {
                    parts.push("cien");
                } else if (chunk.value > 10) {
                    parts.push(this.convertNumberToWords(count) + " " + (count === 1 ? chunk.singular : chunk.plural));
                } else if (chunk.value == 10) {
                    if (count == 1) {
                        parts.push(["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"][num]);
                        num = 0; // Teens are a single word in Spanish
                    } else {
                        parts.push(["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"][count]);
                    }
                }
            }
        });
    
        if (num > 0) {
            parts.push(["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"][num]);
        }
    
        return parts.join(" ").replace("cien cientos", "cien");
    }


    /**
    * Preprocess text:
    * - convert symbols to words
    * - convert numbers to words
    * - filter out characters that should be left unspoken
    * @param {string} s Text
    * @return {string} Pre-processsed text.
    */
    preProcessText(s) {
        // Normalize the input to handle accents and other special characters correctly
        s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
    
        // Replace symbols with their Spanish words using the updated symbols dictionary
        s = s.replace(this.symbolsReg, (symbol) => {
            return ' ' + this.symbols[symbol] + ' ';
        });
    
        // Convert numbers to words, with special attention to Spanish numeric conventions
        s = s.replace(/\d+/g, num => this.convertNumberToWords(parseInt(num)));
    
        // Handle decimal points in numbers (common in prices or precise measurements)
        s = s.replace(/(\d)\,(\d)/g, '$1 coma $2');
    
        // Remove any special characters that are not typically pronounced in text-to-speech
        s = s.replace(/[#_*\'\":;]/g, '');
    
        // Reduce multiple spaces to a single space to clean up formatting
        s = s.replace(/\s+/g, ' ');
    
        // Trim spaces at the beginning and end of the string
        s = s.trim();
    
        return s;
    }


    /**
    * Convert word to Oculus LipSync Visemes and durations
    * @param {string} w Text
    * @return {Object} Oculus LipSync Visemes and durations.
    */
    wordsToVisemes(w) {
        let o = { words: w.toUpperCase(), visemes: [], times: [], durations: [], i: 0 };
        let t = 0;

        const chars = [...o.words];
        while (o.i < chars.length) {
            const c = chars[o.i];
            const ruleset = this.rules[c];
            if (ruleset) {
                for (let i = 0; i < ruleset.length; i++) {
                    const rule = ruleset[i];
                    const test = o.words.substring(0, o.i) + c.toLowerCase() + o.words.substring(o.i + 1);
                    let matches = test.match(rule.regex);
                    if (matches) {
                        rule.visemes.forEach(viseme => {
                            if (o.visemes.length && o.visemes[o.visemes.length - 1] === viseme) {
                                const d = 0.7 * (this.visemeDurations[viseme] || 1);
                                o.durations[o.durations.length - 1] += d;
                                t += d;
                            } else {
                                const d = this.visemeDurations[viseme] || 1;
                                o.visemes.push(viseme);
                                o.times.push(t);
                                o.durations.push(d);
                                t += d;
                            }
                        })
                        o.i += rule.move;
                        break;
                    }
                }
            } else {
                o.i++;
                t += this.specialDurations[c] || 0;
            }
        }

        return o;
    }

}

export { LipsyncEn };
