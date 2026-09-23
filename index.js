const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

// Lista dei domini social autorizzati
const SOCIAL_DOMAINS = [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'reddit.com',
    'linkedin.com',
    'pinterest.com',
    'youtube.com'
];

// Configura l'interfaccia di input/output nel terminale
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Funzione principale che gestisce la richiesta dell'utente
function avviaInterfaccia() {
    rl.question('\n🔍 Inserisci Nome e Cognome da cercare (o digita "esci"): ', async (rispostaUtente) => {
        const queryFull = rispostaUtente.trim();

        if (queryFull.toLowerCase() === 'esci') {
            console.log('Chiusura del programma. Arrivederci!');
            rl.close();
            process.exit(0);
        }

        if (!queryFull) {
            console.log('❌ Input non valido. Riprova.');
            return avviaInterfaccia();
        }

        // Estrae l'ultima parola per usarla come cognome singolo
        const parts = queryFull.split(' ');
        const cognome = parts.length > 1 ? parts[parts.length - 1] : queryFull;

        console.log(`\n⏳ Ricerca social in corso per: "${queryFull}" e "${cognome}"...`);

        try {
            // Esegue le ricerche in contemporanea
            const [risultatiCompleti, risultatiCognome] = await Promise.all([
                cercaSocialSuGoogle(queryFull),
                cercaSocialSuGoogle(cognome)
            ]);

            // Unisce le liste ed elimina i link duplicati
            const mappaRisultati = new Map();
            [...risultatiCompleti, ...risultatiCognome].forEach(item => {
                mappaRisultati.set(item.link, item.titolo);
            });

            // Mostra i risultati a schermo
            if (mappaRisultati.size === 0) {
                console.log('❌ Nessun profilo social trovato su Google per questa ricerca.');
            } else {
                console.log(`\n✨ ✨ PROFILI SOCIAL TROVATI (${mappaRisultati.size}) ✨ ✨`);
                let contatore = 1;
                mappaRisultati.forEach((titolo, link) => {
                    console.log(`\n${contatore}. 📌 ${titolo}`);
                    console.log(`   🔗 URL: ${link}`);
                    contatore++;
                });
            }

        } catch (error) {
            console.error('❌ Si è verificato un errore durante la ricerca:', error.message);
        }

        // Riavvia il ciclo per permettere una nuova ricerca senza dover riavviare lo script
        avviaInterfaccia();
    });
}

// Funzione di estrazione link da Google (Scraper)
async function cercaSocialSuGoogle(query) {
    try {
        const url = `https://google.com{encodeURIComponent(query)}&hl=it`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const \$ = cheerio.load(data);
        const risultati = [];

        \$('div.g').each((i, element) => {
            const titolo = \$(element).find('h3').text();
            const link = \$(element).find('a').attr('href');

            if (titolo && link && link.startsWith('http')) {
                // Controlla se l'URL corrisponde a uno dei social autorizzati
                const èSocial = SOCIAL_DOMAINS.some(domain => link.toLowerCase().includes(domain));
                if (èSocial) {
                    risultati.push({ titolo, link });
                }
            }
        });

        return risultati.slice(0, 7); // Limita a un massimo di 7 risultati per query
    } catch (e) {
        console.error(`[Errore Google] Impossibile completare la ricerca per "${query}":`, e.message);
        return [];
    }
}

// Avvia il programma
console.log('=== STRUMENTO DI RICERCA SOCIAL CLI AVVIATO ===');
avviaInterfaccia();

