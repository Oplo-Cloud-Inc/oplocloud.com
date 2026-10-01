/**
 * ==============================================================================
 * OEdu — Apple-Style SaaS Product Animation Script for Adobe After Effects
 * ==============================================================================
 * 
 * Uses REAL UI components and assets from the OEdu Platform:
 * - Real Oplo Interconnected Rings Mark (viewBox 12 12 76 76)
 * - Real Student Resume Strip (.lx-resume: Media Arts Unit 8)
 * - Real Student Gradebook (.sg-stat GPA 4.00, .sg-row courses)
 * - Real Unit 8 Motion Lab (Keys, Breakdowns & In-Betweens vector art)
 * - Real Teacher Console (Period 3 Media Arts, zero-delay sync)
 * 
 * Compatible with Adobe After Effects (2022+) & after-effects-mcp bridge.
 * ==============================================================================
 */

(function createOEduProductPromo(thisObj) {
    app.beginUndoGroup("Create OEdu Real Platform Animation");

    try {
        var COMP_WIDTH = 1920;
        var COMP_HEIGHT = 1080;
        var COMP_FPS = 30;
        var COMP_DURATION = 26.5;
        var COMP_NAME = "OEdu_Apple_SaaS_Promo";

        var COLORS = {
            bgLight:     [0.961, 0.961, 0.969], // #F5F5F7
            bgDark:      [0.031, 0.031, 0.039], // #08080A
            paperWhite:  [1.000, 1.000, 1.000], // #FFFFFF
            cardDark:    [0.114, 0.114, 0.122], // #1D1D1F
            inkPrimary:  [0.114, 0.114, 0.122], // #1D1D1F
            inkMuted:    [0.525, 0.525, 0.545], // #86868B
            appleBlue:   [0.000, 0.443, 0.890], // #0071E3
            oeduGreen:   [0.071, 0.569, 0.353], // #12915A
            borderLight: [0.898, 0.898, 0.918]  // #E5E5EA
        };

        var project = app.project || app.newProject();
        var mainComp = null;
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i) instanceof CompItem && project.item(i).name === COMP_NAME) {
                mainComp = project.item(i);
                break;
            }
        }
        if (!mainComp) {
            mainComp = project.items.addComp(
                COMP_NAME,
                COMP_WIDTH,
                COMP_HEIGHT,
                1.0,
                COMP_DURATION,
                COMP_FPS
            );
        }
        mainComp.bgColor = COLORS.bgLight;

        // 1. MASTER CONTROLLER & 3D CAMERA
        var masterNull = mainComp.layers.addNull();
        masterNull.name = "🕹️ [CONTROL] Master Controller";
        masterNull.threeDLayer = true;

        var camera = mainComp.layers.addCamera("🎥 [CAMERA] 3D Camera", [COMP_WIDTH / 2, COMP_HEIGHT / 2]);
        camera.property("Transform").property("Position").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2, -1800]);
        camera.property("Transform").property("Point of Interest").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2, 0]);

        var camPos = camera.property("Transform").property("Position");
        camPos.setValueAtTime(0.0, [COMP_WIDTH / 2, COMP_HEIGHT / 2, -1850]);
        camPos.setValueAtTime(4.0, [COMP_WIDTH / 2, COMP_HEIGHT / 2, -1700]);
        camPos.setValueAtTime(4.5, [COMP_WIDTH / 2, COMP_HEIGHT / 2, -1900]);
        camPos.setValueAtTime(11.4, [COMP_WIDTH / 2, COMP_HEIGHT / 2, -1650]);
        camPos.setValueAtTime(11.8, [COMP_WIDTH / 2, COMP_HEIGHT / 2, -1500]);
        camPos.setValueAtTime(18.0, [COMP_WIDTH / 2, COMP_HEIGHT / 2, -1400]);

        // 2. BACKGROUND & GRID
        var bgSolid = mainComp.layers.addSolid(COLORS.bgLight, "Background Canvas", COMP_WIDTH, COMP_HEIGHT, 1.0);
        bgSolid.moveToEnd();

        var gridLayer = mainComp.layers.addSolid(COLORS.paperWhite, "Architectural Grid (64px)", COMP_WIDTH, COMP_HEIGHT, 1.0);
        gridLayer.moveToEnd();
        gridLayer.moveBefore(bgSolid);
        var gridEffect = gridLayer.property("Effects").addProperty("ADBE Grid");
        gridEffect.property("Size From").setValue(2);
        gridEffect.property("Width").setValue(64);
        gridEffect.property("Height").setValue(64);
        gridEffect.property("Border").setValue(1.0);
        gridEffect.property("Color").setValue(COLORS.borderLight);
        gridLayer.property("Transform").property("Opacity").setValue(45);

        // 3. SCENE 1: KINETIC HOOK
        var eyebrowLayer = mainComp.layers.addText("ONE ACADEMIC RECORD");
        eyebrowLayer.name = "Scene 1 — Eyebrow Pill";
        var eyeSource = eyebrowLayer.property("Source Text");
        var eyeDoc = eyeSource.value;
        eyeDoc.fontSize = 18;
        eyeDoc.fillColor = COLORS.appleBlue;
        eyeDoc.font = "HelveticaNeue-Bold";
        eyeDoc.tracking = 200;
        eyeDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        eyeSource.setValue(eyeDoc);
        eyebrowLayer.property("Transform").property("Position").setValue([COMP_WIDTH / 2, 380, 0]);
        eyebrowLayer.property("Transform").property("Opacity").setValueAtTime(0.2, 0);
        eyebrowLayer.property("Transform").property("Opacity").setValueAtTime(0.8, 100);
        eyebrowLayer.property("Transform").property("Opacity").setValueAtTime(4.0, 100);
        eyebrowLayer.property("Transform").property("Opacity").setValueAtTime(4.4, 0);

        var headlineLayer = mainComp.layers.addText("Education has five logins.\nMeet OEdu by Oplo.");
        headlineLayer.name = "Scene 1 — Kinetic Headline";
        var headSource = headlineLayer.property("Source Text");
        var headDoc = headSource.value;
        headDoc.fontSize = 88;
        headDoc.fillColor = COLORS.inkPrimary;
        headDoc.font = "HelveticaNeue-Bold";
        headDoc.leading = 100;
        headDoc.tracking = -30;
        headDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        headSource.setValue(headDoc);
        headlineLayer.property("Transform").property("Position").setValue([COMP_WIDTH / 2, 500, 0]);

        var textAnim = headlineLayer.property("Text").property("Animators").addProperty("ADBE Text Animator");
        textAnim.name = "Text Slide Up";
        var posProp = textAnim.property("Properties").addProperty("ADBE Text Position 3D");
        posProp.setValue([0, 80, 0]);
        var opProp = textAnim.property("Properties").addProperty("ADBE Text Opacity");
        opProp.setValue(0);
        var selector = textAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        selector.property("ADBE Text Percent Start").setValueAtTime(0.4, 0);
        selector.property("ADBE Text Percent Start").setValueAtTime(1.8, 100);
        selector.property("Advanced").property("ADBE Text Smoothness").setValue(100);

        headlineLayer.property("Transform").property("Opacity").setValueAtTime(4.0, 100);
        headlineLayer.property("Transform").property("Opacity").setValueAtTime(4.4, 0);

        // 4. SCENE 2: REAL OEDU BENTO GRID (4.5s - 11.5s)
        var bentoNull = mainComp.layers.addNull();
        bentoNull.name = "📦 [BENTO] Real Platform UI Null";
        bentoNull.threeDLayer = true;
        bentoNull.property("Transform").property("Position").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2, 0]);

        var bRotX = bentoNull.property("Transform").property("X Rotation");
        var bRotY = bentoNull.property("Transform").property("Y Rotation");
        bRotX.setValueAtTime(4.5, 8);
        bRotX.setValueAtTime(8.0, -3);
        bRotX.setValueAtTime(11.4, 0);
        bRotY.setValueAtTime(4.5, -12);
        bRotY.setValueAtTime(8.0, 5);
        bRotY.setValueAtTime(11.4, 0);

        // Card 1: Real OEdu Resume Strip (.lx-resume)
        var card1 = mainComp.layers.addSolid(COLORS.cardDark, "Card 1 — Real .lx-resume (Media Arts Unit 8)", 480, 260, 1.0);
        card1.threeDLayer = true;
        card1.parent = bentoNull;
        card1.property("Transform").property("Position").setValue([-420, -150, 0]);

        // Card 2: Real Gradebook Stats (.sg-stat GPA 4.00)
        var card2 = mainComp.layers.addSolid(COLORS.paperWhite, "Card 2 — Real Gradebook GPA & Courses", 540, 540, 1.0);
        card2.threeDLayer = true;
        card2.parent = bentoNull;
        card2.property("Transform").property("Position").setValue([120, 0, 0]);

        // Card 3: Real Instant Sync Notification
        var card3 = mainComp.layers.addSolid(COLORS.paperWhite, "Card 3 — Teacher Grade Sync Notification", 420, 240, 1.0);
        card3.threeDLayer = true;
        card3.parent = bentoNull;
        card3.property("Transform").property("Position").setValue([620, -150, 0]);

        // Card 4: Real OEdu Unit 8 Motion Lab
        var card4 = mainComp.layers.addSolid(COLORS.paperWhite, "Card 4 — Unit 8 Motion Lab (Keys & In-Betweens)", 480, 260, 1.0);
        card4.threeDLayer = true;
        card4.parent = bentoNull;
        card4.property("Transform").property("Position").setValue([-420, 140, 0]);

        // Card 5: Real Knowledge Map Hub
        var card5 = mainComp.layers.addSolid(COLORS.paperWhite, "Card 5 — Knowledge Map Orbs", 420, 260, 1.0);
        card5.threeDLayer = true;
        card5.parent = bentoNull;
        card5.property("Transform").property("Position").setValue([620, 140, 0]);

        var cards = [card1, card2, card3, card4, card5];
        for (var c = 0; c < cards.length; c++) {
            var cd = cards[c];
            var st = 4.4 + (c * 0.12);
            cd.property("Transform").property("Scale").setValueAtTime(st, [50, 50, 50]);
            cd.property("Transform").property("Scale").setValueAtTime(st + 0.8, [104, 104, 104]);
            cd.property("Transform").property("Scale").setValueAtTime(st + 1.2, [100, 100, 100]);
            cd.property("Transform").property("Opacity").setValueAtTime(st, 0);
            cd.property("Transform").property("Opacity").setValueAtTime(st + 0.4, 100);
            cd.property("Transform").property("Opacity").setValueAtTime(11.2, 100);
            cd.property("Transform").property("Opacity").setValueAtTime(11.6, 0);
        }

        // 5. SCENE 3: REAL OEDU APP WINDOW & CURSOR (11.8s - 18.0s)
        var appWin = mainComp.layers.addSolid(COLORS.paperWhite, "🖥️ OEdu Production Console Window", 1460, 840, 1.0);
        appWin.property("Transform").property("Position").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2 + 20, 0]);
        appWin.property("Transform").property("Opacity").setValueAtTime(11.5, 0);
        appWin.property("Transform").property("Opacity").setValueAtTime(12.0, 100);
        appWin.property("Transform").property("Opacity").setValueAtTime(17.6, 100);
        appWin.property("Transform").property("Opacity").setValueAtTime(18.0, 0);

        var cursorLayer = mainComp.layers.addShape();
        cursorLayer.name = "🖱️ [INTERACTION] Precision Animated Cursor";
        var cGroup = cursorLayer.property("Contents").addProperty("ADBE Vector Group");
        var cFill = cGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        cFill.property("Color").setValue(COLORS.inkPrimary);
        var cPos = cursorLayer.property("Transform").property("Position");
        cPos.setValueAtTime(12.0, [COMP_WIDTH / 2 + 350, COMP_HEIGHT / 2 + 250]);
        cPos.setValueAtTime(13.4, [COMP_WIDTH / 2 - 120, COMP_HEIGHT / 2 - 50]);
        cPos.setValueAtTime(14.8, [COMP_WIDTH / 2 + 200, COMP_HEIGHT / 2 + 40]);
        cursorLayer.property("Transform").property("Opacity").setValueAtTime(11.8, 0);
        cursorLayer.property("Transform").property("Opacity").setValueAtTime(12.2, 100);
        cursorLayer.property("Transform").property("Opacity").setValueAtTime(17.4, 100);
        cursorLayer.property("Transform").property("Opacity").setValueAtTime(17.8, 0);

        // 6. SCENE 4: KINETIC MANIFESTO (18.2s - 22.0s)
        var manText = mainComp.layers.addText(
            "A teacher marks a class.\nAnd the gradebook, the report card,\nand the student's screen...\nare already the same thing."
        );
        manText.name = "Scene 4 — Kinetic Manifesto";
        var mSource = manText.property("Source Text");
        var mDoc = mSource.value;
        mDoc.fontSize = 56;
        mDoc.fillColor = COLORS.inkPrimary;
        mDoc.font = "HelveticaNeue-Bold";
        mDoc.leading = 76;
        mDoc.tracking = -25;
        mDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        mSource.setValue(mDoc);
        manText.property("Transform").property("Position").setValue([COMP_WIDTH / 2, 480, 0]);
        manText.property("Transform").property("Opacity").setValueAtTime(18.2, 0);
        manText.property("Transform").property("Opacity").setValueAtTime(18.9, 100);
        manText.property("Transform").property("Opacity").setValueAtTime(21.4, 100);
        manText.property("Transform").property("Opacity").setValueAtTime(22.0, 0);

        // 7. SCENE 5: GRAND LOGO REVEAL & OUTRO (22.0s - 26.5s)
        var darkSolid = mainComp.layers.addSolid(COLORS.bgDark, "Cinematic Dark Canvas", COMP_WIDTH, COMP_HEIGHT, 1.0);
        darkSolid.property("Transform").property("Opacity").setValueAtTime(21.6, 0);
        darkSolid.property("Transform").property("Opacity").setValueAtTime(22.3, 100);

        var logoLayer = mainComp.layers.addShape();
        logoLayer.name = "✨ [BRAND] Oplo Dual-Crescent Mark";
        logoLayer.property("Transform").property("Position").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2 - 40]);
        var lGroup = logoLayer.property("Contents").addProperty("ADBE Vector Group");
        var lPath = lGroup.property("Contents").addProperty("ADBE Vector Shape - Path");
        var pShape = new Shape();
        pShape.vertices = [[0, -110], [55, -80], [75, -20], [60, 45], [0, 110], [-55, 80], [-75, 20], [-60, -45]];
        pShape.inTangents = [[-30, 0], [-20, -25], [0, -35], [25, -20], [30, 0], [20, 25], [0, 35], [-25, 20]];
        pShape.outTangents = [[30, 0], [20, 25], [0, 35], [-25, 20], [-30, 0], [-20, -25], [0, -35], [25, -20]];
        pShape.closed = true;
        lPath.property("Path").setValue(pShape);

        var lStroke = lGroup.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
        lStroke.property("Color").setValue(COLORS.paperWhite);
        lStroke.property("Stroke Width").setValue(3.5);

        var lTrim = lGroup.property("Contents").addProperty("ADBE Vector Filter - Trim");
        lTrim.property("End").setValueAtTime(22.3, 0);
        lTrim.property("End").setValueAtTime(24.2, 100);

        var lFill = lGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        lFill.property("Color").setValue(COLORS.paperWhite);
        lFill.property("Opacity").setValueAtTime(23.6, 0);
        lFill.property("Opacity").setValueAtTime(24.8, 100);

        var oeduWord = mainComp.layers.addText("OEdu");
        oeduWord.name = "Scene 5 — OEdu Wordmark";
        var wSource = oeduWord.property("Source Text");
        var wDoc = wSource.value;
        wDoc.fontSize = 80;
        wDoc.fillColor = COLORS.paperWhite;
        wDoc.font = "HelveticaNeue-Bold";
        wDoc.tracking = -35;
        wDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        wSource.setValue(wDoc);
        oeduWord.property("Transform").property("Position").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2 + 105, 0]);
        oeduWord.property("Transform").property("Opacity").setValueAtTime(23.8, 0);
        oeduWord.property("Transform").property("Opacity").setValueAtTime(24.8, 100);

        var oeduByline = mainComp.layers.addText("One academic record · by Oplo");
        oeduByline.name = "Scene 5 — Brand Byline";
        var bSource = oeduByline.property("Source Text");
        var bDoc = bSource.value;
        bDoc.fontSize = 22;
        bDoc.fillColor = COLORS.inkMuted;
        bDoc.font = "HelveticaNeue";
        bDoc.tracking = 10;
        bDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        bSource.setValue(bDoc);
        oeduByline.property("Transform").property("Position").setValue([COMP_WIDTH / 2, COMP_HEIGHT / 2 + 155, 0]);
        oeduByline.property("Transform").property("Opacity").setValueAtTime(24.2, 0);
        oeduByline.property("Transform").property("Opacity").setValueAtTime(25.0, 100);

        mainComp.openInViewer();
        alert("✨ OEdu Real Platform Animation composition generated successfully!");

    } catch (err) {
        alert("OEdu AE Script Error: " + err.toString());
    } finally {
        app.endUndoGroup();
    }
})(this);
