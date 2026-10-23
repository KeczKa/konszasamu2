"""Idempotent seed: bilingual news articles for the Konsza Samu school site."""
import asyncio
from datetime import datetime, timedelta, timezone

from lib.db import db, ensure_indexes

IMAGES = [
    "/images/classroom.jpg",
    "/images/students.jpg",
    "/images/library.jpg",
    "/images/village.jpg",
    "/images/hero.jpg",
    "/images/mainphoto.jpg",
]

ARTICLES = [
    {
        "title_ro": "Deschiderea noului an școlar 2026–2027",
        "title_hu": "A 2026–2027-es tanév ünnepélyes megnyitója",
        "content_ro": "Cu bucurie și emoție am deschis porțile școlii pentru noul an școlar. Elevii, părinții și cadrele didactice s-au adunat în curtea școlii din Bățanii Mari pentru ceremonia de început de an, marcând un nou capitol în povestea comunității noastre.\n\nDirectorul școlii a urat tuturor un an plin de reușite, iar elevii claselor întâi au fost întâmpinați cu flori și zâmbete de colegii lor mai mari. Vă așteptăm cu drag la un an de învățare, prietenie și descoperiri!",
        "content_hu": "Örömmel és izgalommal nyitottuk meg iskolánk kapuit az új tanévre. A diákok, szülők és tanárok a nagybaconi iskola udvarán gyűltek össze a tanévnyitó ünnepségre, amely közösségünk történetének új fejezetét jelöli.\n\nAz igazgató mindenkinek sikerekben gazdag évet kívánt, az első osztályosokat pedig virággal és mosolyokkal fogadták nagyobb társaik. Várunk mindenkit szeretettel egy tanulással, barátsággal és felfedezésekkel teli évre!",
        "category": "announcement",
    },
    {
        "title_ro": "Ziua portului popular secuiesc",
        "title_hu": "Székely népviselet napja",
        "content_ro": "Am celebrat moștenirea noastră culturală printr-o zi dedicată portului tradițional secuiesc. Elevii au venit îmbrăcați în costume populare, au dansat dansuri tradiționale și au învățat despre meșteșugurile strămoșilor noștri.\n\nEvenimentul continuă tradiția lui Konsza Samu, culegătorul de folclor născut în Bățanii Mari, care și-a dedicat viața păstrării baladelor și obiceiurilor secuiești. Mulțumim părinților și bunicilor care au împărtășit povești și veșminte de familie.",
        "content_hu": "Kulturális örökségünket ünnepeltük a székely népviseletnek szentelt napon. A diákok népviseletbe öltözve érkeztek, hagyományos táncokat jártak, és megismerkedtek őseink mesterségeivel.\n\nAz esemény Konsza Samu hagyatékát folytatja: a Nagybaconon született néprajzkutató életét a székely balladák és szokások megőrzésének szentelte. Köszönjük a szülőknek és nagyszülőknek, akik családi történeteket és viseleteket osztottak meg velünk.",
        "category": "cultural",
    },
    {
        "title_ro": "Concursul interșcolar de matematică – rezultate excelente",
        "title_hu": "Iskolák közötti matematikaverseny – kiváló eredmények",
        "content_ro": "Elevii școlii noastre au obținut rezultate remarcabile la concursul interșcolar de matematică din județul Covasna. Echipa noastră a adus acasă două premii întâi și o mențiune specială.\n\nFelicităm elevii pentru munca lor asiduă și le mulțumim profesoarelor care i-au pregătit cu răbdare și dedicare. Suntem mândri de voi!",
        "content_hu": "Iskolánk diákjai kiemelkedő eredményeket értek el a Kovászna megyei iskolák közötti matematikaversenyen. Csapatunk két első díjat és egy különdíjat hozott haza.\n\nGratulálunk a diákoknak szorgalmas munkájukhoz, és köszönjük a tanároknak, akik türelemmel és odaadással készítették fel őket. Büszkék vagyunk rátok!",
        "category": "academic",
    },
    {
        "title_ro": "Turneul de fotbal al școlilor din Valea Bâtcii",
        "title_hu": "A Báty-patak menti iskolák labdarúgótornája",
        "content_ro": "Școala noastră a găzduit turneul de fotbal al școlilor din Valea Bâtcii, cu participarea echipelor din Bățanii Mici și Aita Seacă. Terenul de sport a prins viață cu entuziasmul elevilor și al suporterilor.\n\nDupă meciuri strânse și corecte, trofeul a rămas acasă! Felicitări tuturor echipelor pentru fair-play și mulțumim voluntarilor care au făcut posibil acest eveniment.",
        "content_hu": "Iskolánk adott otthont a Báty-patak menti iskolák labdarúgótornájának, Kisbacon és Szárazajta csapatainak részvételével. A sportpálya életre kelt a diákok és szurkolók lelkesedésétől.\n\nSzoros és sportszerű mérkőzések után a trófea otthon maradt! Gratulálunk minden csapatnak a fair playért, és köszönjük az önkénteseknek, akik lehetővé tették ezt az eseményt.",
        "category": "sport",
    },
    {
        "title_ro": "Biblioteca școlii s-a îmbogățit cu 200 de cărți noi",
        "title_hu": "200 új könyvvel gyarapodott az iskolai könyvtár",
        "content_ro": "Datorită unei donații generoase, biblioteca școlii noastre s-a îmbogățit cu peste 200 de volume în limba maghiară și română: literatură pentru copii, atlase, enciclopedii și clasici ai literaturii universale.\n\nInvităm toți elevii să descopere noile cărți în programul de lectură de după-amiază. O bibliotecă vie înseamnă o comunitate care crește.",
        "content_hu": "Egy nagylelkű adománynak köszönhetően iskolánk könyvtára több mint 200 magyar és román nyelvű kötettel gyarapodott: gyerekirodalom, atlaszok, enciklopédiák és a világirodalom klasszikusai.\n\nMinden diákot szeretettel várunk, hogy felfedezze az új könyveket a délutáni olvasóprogramban. Az élő könyvtár növekvő közösséget jelent.",
        "category": "academic",
    },
    {
        "title_ro": "Serbarea de iarnă – colinde și tradiții",
        "title_hu": "Téli ünnep – karácsonyi énekek és hagyományok",
        "content_ro": "Înainte de vacanța de iarnă, elevii au pregătit o serbare caldă cu colinde, poezii și scenete tradiționale. Sala de festivități a fost plină de părinți și bunici care au aplaudat fiecare moment.\n\nMulțumim tuturor celor care au contribuit la organizare și vă dorim sărbători liniștite alături de cei dragi. Ne revedem în noul an cu forțe proaspete!",
        "content_hu": "A téli szünet előtt a diákok meleg ünnepi műsort készítettek karácsonyi énekekkel, versekkel és hagyományos jelenetekkel. A díszterem megtelt szülőkkel és nagyszülőkkel, akik minden pillanatot vastapssal jutalmaztak.\n\nKöszönjük mindenkinek, aki hozzájárult a szervezéshez, és békés ünnepeket kívánunk szeretteitek körében. Az újévben új erővel találkozunk!",
        "category": "cultural",
    },
]


async def main():
    base = datetime.now(timezone.utc)
    created = 0
    for i, art in enumerate(ARTICLES):
        exists = await db.posts.find_one({"title_ro": art["title_ro"]})
        if exists:
            continue
        ts = base - timedelta(days=len(ARTICLES) - i)
        doc = {
            **art,
            "id": __import__("uuid").uuid4().hex,
            "cover_image": IMAGES[i % len(IMAGES)],
            "created_at": ts,
            "updated_at": ts,
        }
        await db.posts.insert_one(doc)
        created += 1
    if await db.gallery_photos.count_documents({}) == 0:
        base_g = datetime.now(timezone.utc)
        for url in IMAGES[:4]:
            await db.gallery_photos.insert_one({
                "id": __import__("uuid").uuid4().hex,
                "storage_path": None,
                "external_url": url,
                "original_filename": "",
                "content_type": "image/jpeg",
                "size": 0,
                "is_deleted": False,
                "created_at": base_g,
            })
        print("Seeded 4 gallery photos.")
    await ensure_indexes()
    print(f"Seed complete: {created} new articles, {len(ARTICLES)} total defined.")


if __name__ == "__main__":
    asyncio.run(main())
