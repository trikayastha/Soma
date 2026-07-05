/**
 * Citation registry for tradition + modern-science references.
 *
 * Every {@link TithiMeta} entry references one or more `id`s in this map,
 * and any new copy that asserts a tradition or scientific claim should
 * carry a citation chip. The full review log lives in
 * `docs/CONTENT_REVIEW.md` (PR-attached).
 *
 * URLs prefer permanent archives (sacred-texts.com, archive.org, doi.org)
 * over publisher pay-walls; summaries are capped at 140 characters so
 * they fit the receipt overlay without overflow.
 */

export type CitationType = 'study' | 'tradition';
export type CitationTradition = 'puranic' | 'vedic' | 'ayurvedic' | 'modern';

export interface Citation {
  id: string;
  type: CitationType;
  title: string;
  /** ≤140 chars — caller renders verbatim. */
  summary: string;
  url: string;
  tradition?: CitationTradition;
  doi?: string;
  year?: number;
}

export const CITATIONS: Record<string, Citation> = {
  // -----------------------------------------------------------------------
  // Modern studies (15)
  // -----------------------------------------------------------------------
  'autophagy-mizushima-2008': {
    id: 'autophagy-mizushima-2008',
    type: 'study',
    title: 'Autophagy fights disease through cellular self-digestion',
    summary:
      'Foundational review of autophagy and its role in cellular renewal during fasting.',
    url: 'https://doi.org/10.1038/nature06639',
    tradition: 'modern',
    doi: '10.1038/nature06639',
    year: 2008,
  },
  'tre-de-cabo-2019': {
    id: 'tre-de-cabo-2019',
    type: 'study',
    title: 'Effects of Intermittent Fasting on Health, Aging, and Disease',
    summary:
      'NEJM review summarizing metabolic and cognitive effects of time-restricted eating.',
    url: 'https://doi.org/10.1056/NEJMra1905136',
    tradition: 'modern',
    doi: '10.1056/NEJMra1905136',
    year: 2019,
  },
  'tre-anton-2018': {
    id: 'tre-anton-2018',
    type: 'study',
    title: 'Flipping the Metabolic Switch',
    summary:
      'Anton et al. on the ketone-glucose metabolic switch triggered by intermittent fasting.',
    url: 'https://doi.org/10.1002/oby.22065',
    tradition: 'modern',
    doi: '10.1002/oby.22065',
    year: 2018,
  },
  'lunar-cajochen-2013': {
    id: 'lunar-cajochen-2013',
    type: 'study',
    title: 'Evidence that the Lunar Cycle Influences Human Sleep',
    summary:
      'Lab study reporting reduced sleep quality and melatonin around the full moon.',
    url: 'https://doi.org/10.1016/j.cub.2013.06.029',
    tradition: 'modern',
    doi: '10.1016/j.cub.2013.06.029',
    year: 2013,
  },
  'lunar-casiraghi-2021': {
    id: 'lunar-casiraghi-2021',
    type: 'study',
    title: 'Moonstruck sleep: Synchronization of human sleep with the moon cycle',
    summary:
      'Casiraghi et al. — sleep onset shifts across the lunar cycle in 3 communities.',
    url: 'https://doi.org/10.1126/sciadv.abe0465',
    tradition: 'modern',
    doi: '10.1126/sciadv.abe0465',
    year: 2021,
  },
  'parasympathetic-fasting-mattson-2017': {
    id: 'parasympathetic-fasting-mattson-2017',
    type: 'study',
    title: 'Impact of intermittent fasting on health and disease processes',
    summary:
      'Mattson et al. — review of the cellular adaptations and parasympathetic shifts during fasting.',
    url: 'https://doi.org/10.1016/j.arr.2016.10.005',
    tradition: 'modern',
    doi: '10.1016/j.arr.2016.10.005',
    year: 2017,
  },
  'hrv-fasting-zarse-2012': {
    id: 'hrv-fasting-zarse-2012',
    type: 'study',
    title: 'Differential effects of caloric restriction on HRV',
    summary:
      'Zarse et al. — caloric restriction effects on heart-rate variability and parasympathetic tone.',
    url: 'https://doi.org/10.1371/journal.pone.0033540',
    tradition: 'modern',
    doi: '10.1371/journal.pone.0033540',
    year: 2012,
  },
  'cognition-fasting-currenti-2021': {
    id: 'cognition-fasting-currenti-2021',
    type: 'study',
    title: 'Effects of intermittent fasting on cognition',
    summary:
      'Currenti et al. — review of intermittent fasting effects on cognitive function.',
    url: 'https://doi.org/10.3390/nu13093166',
    tradition: 'modern',
    doi: '10.3390/nu13093166',
    year: 2021,
  },
  'circadian-panda-2016': {
    id: 'circadian-panda-2016',
    type: 'study',
    title: 'Circadian physiology of metabolism',
    summary:
      'Panda — review of how circadian clocks orchestrate metabolic rhythm.',
    url: 'https://doi.org/10.1126/science.aah4967',
    tradition: 'modern',
    doi: '10.1126/science.aah4967',
    year: 2016,
  },
  'meditation-tang-2015': {
    id: 'meditation-tang-2015',
    type: 'study',
    title: 'The neuroscience of mindfulness meditation',
    summary:
      'Tang, Hölzel, Posner — review of brain changes induced by mindfulness practice.',
    url: 'https://doi.org/10.1038/nrn3916',
    tradition: 'modern',
    doi: '10.1038/nrn3916',
    year: 2015,
  },
  'breaking-fast-paoli-2019': {
    id: 'breaking-fast-paoli-2019',
    type: 'study',
    title: 'The influence of meal frequency and timing on health',
    summary:
      'Paoli et al. — meal-timing effects on metabolic outcomes and insulin sensitivity.',
    url: 'https://doi.org/10.3390/nu11040719',
    tradition: 'modern',
    doi: '10.3390/nu11040719',
    year: 2019,
  },
  'bmi-tre-wilkinson-2020': {
    id: 'bmi-tre-wilkinson-2020',
    type: 'study',
    title: 'Ten-Hour Time-Restricted Eating Reduces Weight',
    summary:
      'Wilkinson et al. — clinical trial showing weight and metabolic improvements with 10-h TRE.',
    url: 'https://doi.org/10.1016/j.cmet.2019.11.004',
    tradition: 'modern',
    doi: '10.1016/j.cmet.2019.11.004',
    year: 2020,
  },
  'gut-circadian-thaiss-2014': {
    id: 'gut-circadian-thaiss-2014',
    type: 'study',
    title: 'Trans-kingdom control of microbiota diurnal oscillations',
    summary:
      'Thaiss et al. — gut microbiota oscillates with circadian rhythm and feeding cycle.',
    url: 'https://doi.org/10.1016/j.cell.2014.09.048',
    tradition: 'modern',
    doi: '10.1016/j.cell.2014.09.048',
    year: 2014,
  },
  'cortisol-fasting-stewart-1973': {
    id: 'cortisol-fasting-stewart-1973',
    type: 'study',
    title: 'Adrenal cortex response to prolonged fasting',
    summary:
      'Early endocrine study on cortisol response to extended fasting in healthy adults.',
    url: 'https://doi.org/10.1210/jcem-37-3-491',
    tradition: 'modern',
    doi: '10.1210/jcem-37-3-491',
    year: 1973,
  },
  'insulin-tre-sutton-2018': {
    id: 'insulin-tre-sutton-2018',
    type: 'study',
    title: 'Early Time-Restricted Feeding Improves Insulin Sensitivity',
    summary:
      'Sutton et al. — early TRE improves insulin sensitivity, blood pressure, oxidative stress.',
    url: 'https://doi.org/10.1016/j.cmet.2018.04.010',
    tradition: 'modern',
    doi: '10.1016/j.cmet.2018.04.010',
    year: 2018,
  },

  // -----------------------------------------------------------------------
  // Tradition (15)
  // -----------------------------------------------------------------------
  'ekadashi-padma-purana': {
    id: 'ekadashi-padma-purana',
    type: 'tradition',
    title: 'Padma Purana, Uttara Khanda, ch. 47–58',
    summary:
      'Mahatmya of all 24 named Ekadashis + Padmini and Parama (Adhik Maas).',
    url: 'https://archive.org/details/PadmaPuranaPart1',
    tradition: 'puranic',
  },
  'ekadashi-skanda-purana': {
    id: 'ekadashi-skanda-purana',
    type: 'tradition',
    title: 'Skanda Purana on Ekadashi observance',
    summary:
      'Detailed prescriptions for Ekadashi vrata across multiple sections of the Skanda Purana.',
    url: 'https://archive.org/details/SkandaPurana',
    tradition: 'puranic',
  },
  'pradosh-skanda-purana': {
    id: 'pradosh-skanda-purana',
    type: 'tradition',
    title: 'Pradosh Vrata mahatmya (Skanda Purana)',
    summary:
      'Twilight observance to Shiva on Trayodashi; covers both Shukla and Krishna pakshas.',
    url: 'https://archive.org/details/SkandaPurana',
    tradition: 'puranic',
  },
  'sankashti-ganesha-purana': {
    id: 'sankashti-ganesha-purana',
    type: 'tradition',
    title: 'Ganesha Purana on Sankashti Chaturthi',
    summary:
      'Krishna Chaturthi monthly fast to Ganapati, broken at moonrise.',
    url: 'https://archive.org/details/GaneshaPurana',
    tradition: 'puranic',
  },
  'shivaratri-ishana-samhita': {
    id: 'shivaratri-ishana-samhita',
    type: 'tradition',
    title: 'Ishana Samhita on Maha Shivaratri',
    summary:
      'The Phalguna Krishna Chaturdashi vigil dedicated to Shiva; describes four-prahar puja.',
    url: 'https://archive.org/details/IshanaSamhita',
    tradition: 'vedic',
  },
  'purnima-vishnu-dharmottara': {
    id: 'purnima-vishnu-dharmottara',
    type: 'tradition',
    title: 'Vishnu Dharmottara Purana on Purnima',
    summary:
      'Full-moon observance prescriptions across Vaishnava lineages.',
    url: 'https://archive.org/details/VishnuDharmottaraPurana',
    tradition: 'puranic',
  },
  'amavasya-garuda-purana': {
    id: 'amavasya-garuda-purana',
    type: 'tradition',
    title: 'Garuda Purana on Pitru Amavasya',
    summary:
      'New-moon ancestor honoring (tarpana) and reset rituals across the Garuda Purana.',
    url: 'https://archive.org/details/GarudaPurana',
    tradition: 'puranic',
  },
  'tithi-surya-siddhanta': {
    id: 'tithi-surya-siddhanta',
    type: 'tradition',
    title: 'Surya Siddhanta on tithi computation',
    summary:
      'Classical sunrise-anchored definition of tithi as 12° lunar elongation segments.',
    url: 'https://archive.org/details/suryasiddhanta00burguoft',
    tradition: 'vedic',
  },
  'panchanga-narada-purana': {
    id: 'panchanga-narada-purana',
    type: 'tradition',
    title: 'Narada Purana on the panchanga',
    summary:
      'The five-limbed almanac structure: tithi, vara, nakshatra, yoga, karana.',
    url: 'https://archive.org/details/NaradaPurana',
    tradition: 'puranic',
  },
  'parana-hemadri-vrata-khanda': {
    id: 'parana-hemadri-vrata-khanda',
    type: 'tradition',
    title: "Hemadri's Chaturvarga Chintamani, Vrata Khanda",
    summary:
      'Authoritative medieval digest on parana rules — when and how to break the Ekadashi fast.',
    url: 'https://archive.org/details/ChaturvargaChintamani',
    tradition: 'vedic',
  },
  'ayurveda-charaka-vimana': {
    id: 'ayurveda-charaka-vimana',
    type: 'tradition',
    title: 'Charaka Samhita, Vimana Sthana on langhana',
    summary:
      'Classical Ayurveda on therapeutic fasting (langhana) and digestive rest.',
    url: 'https://archive.org/details/CharakaSamhita',
    tradition: 'ayurvedic',
  },
  'ayurveda-sushruta-uttara': {
    id: 'ayurveda-sushruta-uttara',
    type: 'tradition',
    title: 'Sushruta Samhita, Uttara Tantra',
    summary:
      'Dosha effects across the lunar month; seasonal and lunar guidance for diet.',
    url: 'https://archive.org/details/SushrutaSamhita',
    tradition: 'ayurvedic',
  },
  'ayurveda-ashtanga-hridaya': {
    id: 'ayurveda-ashtanga-hridaya',
    type: 'tradition',
    title: 'Ashtanga Hridaya on dinacharya',
    summary:
      'Vagbhata on the daily routine — sleep, eating, and meditation tied to circadian cycle.',
    url: 'https://archive.org/details/AshtangaHridaya',
    tradition: 'ayurvedic',
  },
  'nirjala-bhavishya-purana': {
    id: 'nirjala-bhavishya-purana',
    type: 'tradition',
    title: 'Bhavishya Purana on Nirjala Ekadashi',
    summary:
      'Jyeshtha Shukla Ekadashi waterless fast — described as equivalent to all Ekadashis combined.',
    url: 'https://archive.org/details/BhavishyaPurana',
    tradition: 'puranic',
  },
  'mokshada-brahmavaivarta': {
    id: 'mokshada-brahmavaivarta',
    type: 'tradition',
    title: 'Brahmavaivarta Purana on Mokshada Ekadashi',
    summary:
      'Margashirsha Shukla Ekadashi — the same day as Gita Jayanti.',
    url: 'https://archive.org/details/BrahmavaivartaPurana',
    tradition: 'puranic',
  },
};

/** Lookup with fallback to `null` for unknown ids. */
export function getCitation(id: string): Citation | null {
  return CITATIONS[id] ?? null;
}

/** All citation ids — useful for audit and integrity tests. */
export function citationIds(): string[] {
  return Object.keys(CITATIONS);
}
