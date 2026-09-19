# נכסי הדמויות — Padel Club

המקור: [Kenney Blocky Characters 2.0](https://kenney.nl/assets/blocky-characters), הורדה בתאריך 15.09.2026. רישיון CC0; העתק מקורי נמצא ב־LICENSE-Kenney.txt.

- character-b.glb ו־character-c.glb: מודלים מקוריים עם אנימציות.
- Textures: טקסטורות המקור, נחוצות לפתיחת ה־GLB בתוכנת תלת־ממד.
- characters.json: גיאומטריה, טקסטורות וקליפים שהומרו לשילוב בתוך קובץ המשחק.
- הקוד padel-android/src/clubhouse.js מתאים את חלקי הדמות למפרקים הקיימים, כולל חיתוך במרפקים ובברכיים. חבטות הפאדל נשארות מונעות בידי מנגנון המגע של המשחק; אנימציות הראש לתגובות מגיעות מהחבילה. תצוגות הריצה, החימום והחבטה הן התאמות בקוד.

בתפריט Players בוחרים Rio, Alex או Club pro (הדמות הקודמת), ובודקים חימום, ריצה, חבטה וחגיגה בתצוגה חיה. הבחירה נשמרת במכשיר.

לבנייה: node padel-android/scripts/build-experience.cjs ואחריו node padel-android/scripts/build-assets.cjs. אין צורך בהורדה חוזרת. import-characters.cjs מיועד לייבוא מחדש מתיקיית החבילה שחולצה ב־.tmp/kenney-characters.

המודלים בסגנון ארקייד, לא דמויות פוטוריאליסטיות. שמות Rio ו־Alex הם שמות תצוגה של המשחק.
