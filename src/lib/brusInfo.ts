import { slugify } from './slug'

export type BrusInfo = {
  /** Navnet slik det står i bruslisten (brukes for å koble info til riktig brus) */
  navn: string
  produsent: string
  sted?: string
  /** F.eks. "Sukkerfri" eller "Uten tilsatt sukker". Utelates for vanlig brus. */
  sukker?: string
  info?: string
  /** Filnavn i src/assets/brus/ */
  bilde?: string
  /** Andre navn som skal gi samme info (f.eks. gamle stavemåter) */
  alias?: string[]
}

export const BRUS_INFO: BrusInfo[] = [
  { navn: 'Biz-nissen Julebrus (Wettre Bryggeri)', produsent: 'Wettre Bryggeri', sted: 'Asker', info: '«Askers egen julebrus» – sprudlende julebrus med bringebær, kirsebær, rips og solbær.', bilde: 'biz.jpg', alias: ['Biz-nizzen Julebrus (Wettre Bryggeri)', 'Biz-nissen'] },
  { navn: 'Lindheims Julebrus (Lindheim Ølkompani)', produsent: 'Lindheim Ølkompani', sted: 'Gvarv, Telemark', sukker: 'Uten tilsatt sukker', info: 'Laget kun av frukt fra Lindheim og Gvarv – søte epler med kirsebær og moreller. Frisk og fruktig for alle mellom 0 og 100 år!', bilde: 'lindheims.jpg' },
  { navn: 'Skum Tomte (Herrljunga Drycker)', produsent: 'Herrljunga Drycker', sted: 'Sverige', sukker: 'Sukkerfri', info: 'Sukkerfri «candy soda» med smak av svenske skumtomtar – søt, myk og leken. Julegodteri i flytende form.', bilde: 'skumtomte.jpg' },
  { navn: 'Aass Julebrus (Aass Bryggeri)', produsent: 'Aass Bryggeri', sted: 'Drammen', sukker: 'Sukkerfri', info: '«Som vinteren trenger snø, skal julebrusen være rød. Bringebær og mager søt, sprudledigg til julegrøt.» – Aass-nissen', bilde: 'aass.jpg' },
  { navn: 'Julebobler (Frukthagen Hardanger)', produsent: 'Frukthagen Hardanger', sted: 'Hardanger', sukker: 'Uten tilsatt sukker', info: 'Sprudlande fruktdrikk laga med kjærleik og dei beste norske epla, pærene, morellane, plommene og kirsebæra. Kortreist julestemning – drift sidan 1900.', bilde: 'hardanger.jpg' },
  { navn: 'Fruktsmekk (Safteriet)', produsent: 'Safteriet', info: 'Fruktsmekk Jul + Nyttår: håndverksbrus med ekte fruktsaft – dyp rød surkirsebær, syrlige Glen Ample-bringebær, rørsukker og frisk sitron. Knallgod til all slags julemat, og kan drikkes hele året.', bilde: 'fruktsmekk.jpg' },
  { navn: 'Julebrusfabrikkens Rampebrus (Berentsens Brygghus)', produsent: 'Berentsens Brygghus', sted: 'Egersund', info: 'Julebrus som Rampenissen har gjort en liten rampestrek med – overraskende farge og spennende smak. Klarte dere å finne ut hva den smaker?', bilde: 'rampebrus.jpg' },
  { navn: 'Sprudlende Skviz Julebrus (Klokk & Co)', produsent: 'Klokk & Co', sted: 'Oslo', sukker: 'Uten tilsatt sukker', info: 'Julebrus med smak av røde bær, laget kun av fruktjuice og boblevann. Perfekt til risengrynsgrøt, pepperkaker og julemat.', bilde: 'skviz.jpg' },
  { navn: 'Julebrus (Kinn Bryggeri)', produsent: 'Kinn Bryggeri', sted: 'Florø', info: '«Julestemning på flaske.» Frisk lukt og smak av bringebær, med nydelig balanse mellom sødme, bær og bobler. Utsolgt fra bryggeriet – ligger ute på Finn for 500 kr flaska!', bilde: 'kinn.jpg' },
  { navn: 'Hamar og Lillehammer Julebrus Lett (Ringnes)', produsent: 'Ringnes', sted: 'Hamar/Lillehammer', sukker: 'Uten sukker', info: 'Norges mest populære og svært tradisjonelle julebrus – en folkefavoritt med karakteristisk smak av juleminner. Helt uten sukker.', bilde: 'ringnes.jpg', alias: ['Julebrus (Ringnes)', 'Hamar og Lillehammer Julebrus'] },
  { navn: 'Julebrus (Røros Drikkeri)', produsent: 'Røros Drikkeri', sted: 'Røros', info: 'Ekte juleglede – følelsen av å liste seg barbeint ned trappa tidlig julaften morgen. En julebrus for øyeblikkene du husker resten av livet.', bilde: 'roros.jpg' },
  { navn: 'Pop Christmas Cream (Alpha Brand)', produsent: 'Alpha Brand', sukker: 'Uten tilsatt sukker', info: 'Deilig smak av kremet julebrus – en smak som roper fresh og skiller seg ut. Inneholder fiber!', bilde: 'pop.jpg' },
  { navn: 'Rudolf & Nissens Julebrus (Oskar Sylte)', produsent: 'Oskar Sylte', sted: 'Molde', info: 'Tradisjonell rød julebrus med bærpreg og hint av vanilje.', bilde: 'rudolf-nissens.jpg' },
  { navn: 'Apotekarnes Julmust (Carlsberg)', produsent: 'Carlsberg Sverige', sted: 'Sverige', sukker: 'Sukkerfri', info: 'Mørk julmust som skummer godt, med smak av humle og malt. Et svensk julebord er knapt tenkelig uten must.', bilde: 'apotekarnes.jpg' },
  { navn: 'Øryeahh Julebrus (Innerstielva i Ørje)', produsent: 'Innerstielva', sted: 'Ørje', info: 'Inspirert av barndommens julebrus, med smak av bringebær og hylleblomst – delvis fra egen hage.', bilde: 'oryeahh.jpg' },
  { navn: 'Romas Røde Julebrus (Roma Mineralvannfabrikk)', produsent: 'Roma Mineralvannfabrikk – «Den lille brusfabrikken»', sted: 'Romerike', sukker: 'Sukkerfri', info: 'Den mest populære smaken i den prisvinnende julebrusserien. Frisk, søt smak av bringebærdrops – Romerikes egen favorittjulebrus.', bilde: 'romas.jpg' },
  { navn: 'Løren Julebrus (Ekeby Gårdsbryggeri)', produsent: 'Ekeby Gårdsbryggeri for Meny Løren', sted: 'Oslo', info: 'Oppfølgeren til fjorårets sukkerfrie variant, nå med sukker. Smaken er relativt lik – med den samme fantastiske blåfargen.', bilde: 'loren-bla.jpg' },
  { navn: 'Gamlebyens Julebrus (Nøisom)', produsent: 'Nøisom', sted: 'Fredrikstad', info: 'Laget med ekte rips og bringebær – frisk og litt syrlig, slik en julebrus skal være. Nøisom fant ingen spor av en egen Fredrikstad-julebrus, så de lagde en og oppkalte den etter festningsbyen.', bilde: 'gamlebyens.jpg' },
  { navn: 'Rudolf og Nissemors (Oskar Sylte)', produsent: 'Oskar Sylte', sted: 'Molde', info: '2026-utgaven er gul – julebrus med mandarinsmak!', bilde: 'rudolf-nissemors.jpg' },
  { navn: 'Julebrus (Grimstad Brusfabrikk)', produsent: 'Grimstad Brusfabrikk', sted: 'Grimstad', info: 'Økologiske solbær fra Mølstad gård, solmodne epler fra Grimstad, syrlig økologisk bergamottjuice fra Sicilia og krydder av stjerneanis, ingefær og appelsinskall.', bilde: 'grimstad.jpg' },
  { navn: 'Julmust (Herrljunga)', produsent: 'Herrljunga', sted: 'Sverige', info: 'Klassisk julmust med røtter fra 1911. Tradisjonell blanding av kornmalt, humle, einebær, brent sukker og pomerans.', bilde: 'herrljunga.jpg' },
]

// Bildene bakes inn av Vite (hash i filnavnet)
const images = import.meta.glob('../assets/brus/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const bySlug = new Map<string, BrusInfo>()
for (const b of BRUS_INFO) for (const n of [b.navn, ...(b.alias ?? [])]) bySlug.set(slugify(n), b)

export function getBrusInfo(name: string): (BrusInfo & { bildeUrl?: string }) | undefined {
  const b = bySlug.get(slugify(name))
  if (!b) return undefined
  return { ...b, bildeUrl: b.bilde ? images[`../assets/brus/${b.bilde}`] : undefined }
}
