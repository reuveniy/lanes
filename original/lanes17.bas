100 '***************************************************************
110 '*    THE GAME OF STAR LANES - The Galectic Market Game        *
120 '*    2-6 Players               Updte date 12.08.2001          *
125 '*    Set Max Players to 6  Enhence Screen to 80x30            *
    '*    Ver 1.17 Base on 1.16A + Info Screen Command  (I)        *
130 '***************************************************************

    SCREEN 12
    WIDTH 80, 30
    Base2 = 24
    ScreenColSize = 80
    ScreenRowSize = 30
 '   FOR i = 0 TO 15: COLOR i: PRINT i * 1000: NEXT i
 '   WHILE INKEY$ = "": WEND

 DEFINT A, C, F, I-J, M-N, P, R, X-Y
 KEY OFF: SCREEN 12, 0, 0, 0: CLS
 DIM M(24, 32), S(26, 6), N$(26), D1(26), S1(26), Q(26), HOLD(6), TRAP(80, 2), FTRAP(80, 2)
 DIM DOUBLE.PAY(20, 2), MX$(26), NA(26), B(26), P$(26), RX(26), CX(26), B1(26), MSG$(26), GB(26)
 DIM T.Val(6), PAtr(6), SYM$(6), MaxSell(6), CurSell(6), KIndex(6)
 DIM PlayerBonus(10)
 PAtr(1) = 10: PAtr(2) = 12: PAtr(3) = 13
 PAtr(4) = 11: PAtr(5) = 9: PAtr(6) = 6
 SpecialHelp = 0
 MaxDP = 10
 DIM COMPATR(32)
 COLOR 15 ' , 8, 1:
 CLS : PRINT TAB(20); "T H E    S T A R    L A N E S    G A M E"
 PRINT : PRINT TAB(25); "PROGRAM BY E.HADDAD     1985": PRINT : PRINT
 ' INPUT "Is this Game shoud be Score Recorded [N][Y] "; Score.Rec$
 ' IF LEFT$(Score.Rec$, 1) = "Y" OR LEFT$(Score.Rec$, 1) = "y" THEN
 Record.Score = 1
 ' ELSE Record.Score = 0
 INPUT "HOW MANY PLAYERS (2-6)"; P1
 SEED = TIMER
 RANDOMIZE SEED
 ' PRINT "RANDOM SEED IS : ", SEED
    PRINT
    FOR i = 1 TO P1
      P$(i) = STRING$(8, " ")
      KIndex(i) = 100
      PRINT "Player "; i; : INPUT "What is your Name"; A$
      FOR J = 1 TO LEN(A$)
        B = ASC(MID$(A$, J, 1))
        IF B > 64 AND B < 92 THEN B = B + 32
        IF J = 1 THEN B = B - 32
        MID$(A$, J, 1) = CHR$(B)
      NEXT J
    LSET P$(i) = A$
    NEXT i

    P1$ = STR$(P1): MID$(P1$, 1, 1) = "Q": Fsqr.Name$ = "Lanes.S" + P1$
    OPEN "r", #1, Fsqr.Name$, 32
    FIELD #1, 8 AS Player.Names$, 4 AS Player.Win$, 4 AS Number.Games$, 16 AS Game.Date$
    lof1 = LOF(1)
    frec = lof1 / 32
    GOSUB print.sqr
'  print:print "Hit any key to continue"
'   while inkey$=""
'   wend
360 PRINT "Map setting is 19x28 with Max 26 Companies"
400 INPUT "NUMBER OF GAME STEPS (80-360)   "; Game.Steps
450 IF Game.Steps < 80 OR Game.Steps > 360 THEN Game.Steps = 180
    IF (Game.Steps / P1) - INT(Game.Steps / P1) <> 0 THEN 400
460 INPUT "Enter Star count (100-180) "; STAR.N
    IF STAR.N > 180 OR STAR.N < 100 THEN STAR.N = 150
470 INPUT "Enter Max D-Payment (2-16) "; MaxDP
    IF MaxDP > 16 OR MaxDP < 2 THEN MaxDP = 10
Start1:
500 MaxCol = 28: MAXROW = 19: MaxComp = 26
    i = INT(MaxComp / P1): MaxComp = P1 * i
    MSG$(1) = " Space-Fleet suffer damages !!!"
    MSG$(2) = " Space-Fleet Main computer is out of order !!!"
    MSG$(3) = " Communication with fleet lost !!!"
    MSG$(4) = " Sabotage in energy resourses !!!"
    MSG$(5) = " Uncontrol Atomic reaction in main base !!!"
    MSG$(6) = " New energy resourses descoverd !!!"
    MSG$(7) = " Sales increase by 25% !!!"
    MSG$(8) = " Federation bonuse recieved !!!"
    MSG$(9) = " OutSiders attack on main Base !!!"
    MSG$(10) = " Increase in royalties recption !!!"
    MSG$(11) = " Tax Returning !!!"
    MSG$(12) = " Klington attack on the Space-Fleet !!!"
    MSG$(13) = " Federation Increase in Tax Payment !!!"
    MSG$(14) = " Company Battle-ship distroyed !!!"
    GB(1) = -.1: GB(2) = -.2: GB(3) = -.2: GB(4) = -.3: GB(5) = -.5: GB(6) = .3
    GB(7) = .2: GB(8) = .2: GB(9) = -.3: GB(10) = .1: GB(11) = .2: GB(12) = -.1: GB(13) = -.15: GB(14) = -.05: GB(15) = .05: GB(16) = .05: GB(17) = -.05: GB(18) = .05: GB(19) = -.1
    MSG$(15) = " STOCK-SALE !!!"
    MSG$(16) = " New gold mine discoverd !!!"
    MSG$(17) = " Business ship was crushed !!!"
    MSG$(18) = " Good news from trading mission !!!"
    MSG$(19) = " Sales drop by 15% !!!"
1700 '
1750 FOR i = 1 TO MaxComp
1800    FOR J = 1 TO 4
1850     D1(i) = 0: S1(i) = 100: Q(i) = 0: B(i) = 6000
1900    NEXT J
1950 NEXT i
ShareValueIndex = 6000
LastShareValueIndex = 6000
     MX$(1) = "Altair Starways   *": MX$(2) = "BatleShips  Ltd.  *"
     MX$(3) = "Capella Freight   *": MX$(4) = "Destroyers Inc.   *"
     MX$(5) = "Eridani Explosive *"
     MX$(6) = "Fatima Sabotage Co*": MX$(7) = "General Motors    *"
     MX$(8) = "Holy Land Starway *": MX$(9) = "I.B.M.            *"
     MX$(10) = "Japanese Cargo   *": MX$(11) = "Kantakey Freight *"
     MX$(12) = "Lockhid Space Co.*": MX$(13) = "Mad Men Shipments*"
     MX$(14) = "Nec Air-Cargo Co.*": MX$(15) = "Olimpic Cargo    *"
     MX$(16) = "Pompa-Starways   *": MX$(17) = "Queen Space Co.  *"
     MX$(18) = "Ricardo Airways  *": MX$(19) = "Sun Shine Co.    *"
     MX$(20) = "Toramishi AirCrgo*": MX$(21) = "Uoeing Oil Ltd.  *"
     MX$(22) = "Velvala Airways  *": MX$(23) = "Wolf Sky-Ridder  *"
     MX$(24) = "X Ray Ltd.       *": MX$(25) = "Yotomoto Crgo    *"
     MX$(26) = "Zicron Megic Co. *"
     L$ = ".+*ABCDEFGHIJKLMNOPQRSTUVWXYZ": M$ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ": Q = 0
     FOR i = 1 TO MAXROW: FOR J = 1 TO MaxCol: M(i, J) = 1: NEXT J: NEXT i: GOLD.COUNT = INT(P1 * (1.5 + RND)) + 3

2550 FOR ptr = 1 TO STAR.N
2563   i = INT(1 + MAXROW * RND): J = INT(1 + MaxCol * RND)
      ' IF I=1 OR J=1 THEN 2563
      ' IF I=MAXROW OR J=MAXCOL THEN 2563
       IF M(i, J) = 3 THEN 2563
       CN = 0
       IF M(i - 1, J) = 3 THEN CN = CN + 1
       IF M(i + 1, J) = 3 THEN CN = CN + 1
       IF M(i, J - 1) = 3 THEN CN = CN + 1
       IF M(i, J + 1) = 3 THEN CN = CN + 1
       IF CN = 4 THEN 2563
       IF M(i - 1, J - 1) = 3 AND M(i, J - 1) = 3 AND M(i - 1, J) = 3 THEN 2563
       IF M(i + 1, J + 1) = 3 AND M(i + 1, J) = 3 AND M(i, J + 1) = 3 THEN 2563
       IF M(i + 1, J - 1) = 3 AND M(i + 1, J) = 3 AND M(i, J - 1) = 3 THEN 2563
       IF M(i - 1, J + 1) = 3 AND M(i - 1, J) = 3 AND M(i, J + 1) = 3 THEN 2563
       M(i, J) = 3
      NEXT ptr
2600 'FOR I=1 TO MAXROW
2650 '   FOR J=1 TO MAXCOL
2700 '     IF INT(RND*11)+1<>10 OR M(I,J)=>3 THEN 2800
2750 '     M(I,J)=3:Q=Q+1
2800 '   NEXT J
2850 'NEXT I:print q,
2860 'IF Q<MAXCOL*MAXROW*.25 THEN 2600
2870 'IF Q>MAXCOL*MAXROW*.35 THEN 2550
2871 'PRINT Q:COLOR 14
2872 FOR GC = 1 TO GOLD.COUNT
2873   i = INT(1 + MAXROW * RND): J = INT(1 + MaxCol * RND)
2874   IF i <= 1 OR J <= 2 THEN 2873
2875   IF i = MAXROW OR J >= MaxCol - 1 THEN 2873
2876   IF M(i, J) = 4 THEN 2873
       IF M(i - 1, J) = 4 OR M(i + 1, J) = 4 THEN GOTO 2873
       IF M(i, J - 1) = 4 OR M(i, J + 1) = 4 THEN GOTO 2873
       CN = 0
       IF M(i - 1, J) = 3 THEN CN = CN + 1
       IF M(i + 1, J) = 3 THEN CN = CN + 1
       IF M(i, J - 1) = 3 THEN CN = CN + 1
       IF M(i, J + 1) = 3 THEN CN = CN + 1
       IF CN >= 3 THEN 2873
2877   M(i, J) = 4
2878 NEXT GC
2879 GOLD.COUNT = GOLD.COUNT * 3
2880 FOR GC = 1 TO GOLD.COUNT
2881   R = INT(1 + MAXROW * RND): C = INT(1 + MaxCol * RND)
2882   IF M(R, C) = 4 OR M(R, C) = 3 THEN 2881
2883   A = 0: IF M(R + 1, C) > 2 THEN A = A + 1
2885   IF R < MAXROW AND M(R + 1, C) > 2 THEN A = A + 1
2886   IF R > 1 AND M(R - 1, C) > 2 THEN A = A + 1
2887   IF C < MaxCol AND M(R, C + 1) > 2 THEN A = A + 1
2888   IF C > 1 AND M(R, C - 1) > 2 THEN A = A + 1
2889   IF A < 2 THEN 2881
2890   TRAP(GC, 1) = R: TRAP(GC, 2) = C
2891 NEXT GC
2892 FOR GC = 1 TO GOLD.COUNT
2893   R = INT(1 + MAXROW * RND): C = INT(1 + MaxCol * RND)
2894   IF M(R, C) = 4 OR M(R, C) = 3 THEN 2893
2896   FTRAP(GC, 1) = R: FTRAP(GC, 2) = C
2898 NEXT GC
2900 FOR GC = 1 TO MaxDP
2902   R = INT(1 + MAXROW * RND): C = INT(1 + MaxCol * RND)
2904   IF M(R, C) = 4 OR M(R, C) = 3 THEN 2902
2906   DOUBLE.PAY(GC, 1) = R: DOUBLE.PAY(GC, 2) = C
2910 NEXT GC
2915 CLS : GOSUB 13550
2916 INPUT "Is this screen map ok, Enter [Y][N] "; AN$
2917 IF LEFT$(AN$, 1) = "N" OR LEFT$(AN$, 1) = "n" THEN GOTO Start1
2920 KBonus = 1000: COLOR 15

2950 i = INT(P1 * RND + 1) ' COLOR PATR(I):PRINT P$(I);" Is the first player to move"
2960 P = i: START.TIME$ = TIME$: CLS
3000 K = 0: GOSUB 13550
3020 FOR i = 1 TO P1: SYM$(i) = CHR$(16): NEXT i
3050 GOTO 3300
3100 K = K + 1
3150   IF K >= Game.Steps THEN CLS : LOCATE 1, 1: GOTO 11450
3200   P = P + 1
3250   IF P = P1 + 1 THEN P = 1
       CurSell(P) = 0
       LastShareValueIndex = ShareValueIndex
3300   FOR i = 1 TO 5
3350      RX(i) = INT((MAXROW) * RND + 1): CX(i) = INT((MaxCol) * RND + 1)
3400        I1 = i - 1
3450        IF RX(i) = RX(I1) AND CX(i) = CX(I1) THEN 3350
3500        I1 = I1 - 1: IF I1 >= 0 THEN 3450
3550      IF M(RX(i), CX(i)) > 1 THEN 3350
3600           I1 = 1
3650           IF Q(I1) = 0 THEN 4350
3700           I1 = I1 + 1: IF I1 <= MaxComp THEN 3650
3750      A1 = M(RX(i), CX(i) + 1): A2 = M(RX(i), CX(i) - 1)
3800      A3 = M(RX(i) + 1, CX(i)): A4 = M(RX(i) - 1, CX(i))
3850      IF A1 > 4 OR A2 > 4 OR A3 > 4 OR A4 > 4 THEN 4350
3950      IF A1 > 1 AND A1 < 5 THEN 3350
3952      IF A2 > 1 AND A2 < 5 THEN 3350
3954      IF A3 > 1 AND A3 < 5 THEN 3350
3956      IF A4 > 1 AND A4 < 5 THEN 3350
4350   NEXT i
4400   X = 1: Y = MAXROW + 1: GOSUB 12900: GOSUB 20000: COLOR 7
4450   GOSUB 15600 'Galetic bomb
4500   GOSUB 16250 'Print stock value
4510   COLOR 14 ', 0
4520   FOR i = 1 TO 5
4550     POSY = RX(i): POSX = CX(i)
4600     GOSUB 12700: PRINT CHR$(&H30 + i);
4650   NEXT i
4700   '
4750   GOSUB 17800: X = 1: Y = MAXROW + 1: GOSUB 12900: COLOR 7 ', 1:
       INPUT "Enter Cmd [M=Map,H=Holding,S=Steps,I=Info, 1-5  Move] ", R$: PRINT
4800   COLOR 15 ', 0:
       FOR i = 1 TO 5: POSY = RX(i): POSX = CX(i): GOSUB 12700: PRINT "."; : NEXT
4850   Y = 13: X = 1: GOSUB 12900: COLOR 15 ', 8
4900   IF LEFT$(R$, 1) = "M" OR LEFT$(R$, 1) = "m" THEN GOSUB 13550: GOTO 4510
4910   IF LEFT$(R$, 1) = "S" OR LEFT$(R$, 1) = "s" THEN R$ = "": GOSUB 38000: GOTO 4510
4920   IF LEFT$(R$, 1) = "I" OR LEFT$(R$, 1) = "i" THEN R$ = "": GOSUB InfoScreenR: GOTO 4510
4950   IF LEFT$(R$, 1) = "H" OR LEFT$(R$, 1) = "h" THEN GOSUB 10600: GOTO 4510
5000   IF VAL(R$) > 5 OR VAL(R$) < 1 THEN 4750
5050   R = RX(VAL(R$)): C = CX(VAL(R$)): SEL.POS = i: TRAP = 0: FTRAP = 0: DOUBLE.PAY = 0
5060   FOR GC = 1 TO GOLD.COUNT
5070     IF Q(MaxComp) <> 0 AND TRAP(GC, 1) = R AND TRAP(GC, 2) = C THEN TRAP = 1
5075     IF FTRAP(GC, 1) = R AND FTRAP(GC, 2) = C THEN FTRAP = 1
5080   NEXT GC
5085   IF P = Player.First THEN 5100
5090   FOR GC = 1 TO MaxDP
5094     IF DOUBLE.PAY(GC, 1) = R AND DOUBLE.PAY(GC, 2) = C THEN DOUBLE.PAY = 1
5096   NEXT GC
       IF K > (P1 * 3) THEN IF T.Val(P) < T.Val(Player.First) * .45 THEN SpecialHelp = 1
5100   '
5150   A1 = M(R - 1, C): A2 = M(R + 1, C): A3 = M(R, C + 1): A4 = M(R, C - 1)
5200   IF A1 <= 1 AND A2 <= 1 AND A3 <= 1 AND A4 <= 1 THEN M(R, C) = 2: Y = R: X = C: GOSUB 13100: GOTO 6700
5250   IF A1 > 4 AND A2 > 4 AND A2 <> A1 THEN GOSUB 7750
5300   IF A1 > 4 AND A3 > 4 AND A3 <> A1 THEN GOSUB 7750
5350   IF A1 > 4 AND A4 > 4 AND A4 <> A1 THEN GOSUB 7750
5400   IF A2 > 4 AND A3 > 4 AND A3 <> A2 THEN GOSUB 7750
5450   IF A2 > 4 AND A4 > 4 AND A4 <> A2 THEN GOSUB 7750
5500   IF A3 > 4 AND A4 > 4 AND A3 <> A4 THEN GOSUB 7750
5550   IF A1 < 5 AND A2 < 5 AND A3 < 5 AND A4 < 5 THEN 5900
5600   IF M(R, C) > 4 THEN Y = R: X = C: GOSUB 13100: GOTO 6700
5650   IF A1 > 4 THEN i = A1 - 4
5700   IF A2 > 4 THEN i = A2 - 4
5750   IF A3 > 4 THEN i = A3 - 4
5800   IF A4 > 4 THEN i = A4 - 4
5850   Q(i) = Q(i) + 1: S1(i) = S1(i) + 100: M(R, C) = i + 4: Y = R: X = C: GOSUB 13100: GOTO 6160
5900   i = 1
5950   IF Q(i) = 0 THEN 6100
6000   i = i + 1: IF i <= MaxComp THEN 5950
6050   IF M(R, C) < 3 THEN M(R, C) = 2: Y = R: X = C: GOSUB 13100: GOTO 6700
6100   S(i, P) = S(i, P) + 5: Q(i) = 1: NA(i) = P
6150   X = 1: Y = 23: GOSUB 12900: GOSUB 11300: ALARM = 3: GOSUB AlarmHndllerR: PRINT MX$(i); "  A new shipping company has been formed!";
6160   IF A1 = 4 THEN S1(i) = S1(i) + 1000
6170   IF A2 = 4 THEN S1(i) = S1(i) + 1000
6180   IF A3 = 4 THEN S1(i) = S1(i) + 1000
6190   IF A4 = 4 THEN S1(i) = S1(i) + 1000
6200   IF A1 = 3 THEN S1(i) = S1(i) + 500
6250   IF A2 = 3 THEN S1(i) = S1(i) + 500
6300   IF A3 = 3 THEN S1(i) = S1(i) + 500
6350   IF A4 = 3 THEN S1(i) = S1(i) + 500
6400   IF A1 = 2 THEN S1(i) = S1(i) + 100: Q(i) = Q(i) + 1: M(R - 1, C) = i + 4: Y = R - 1: X = C: GOSUB 13100
6450   IF A2 = 2 THEN S1(i) = S1(i) + 100: Q(i) = Q(i) + 1: M(R + 1, C) = i + 4: Y = R + 1: X = C: GOSUB 13100
6500   IF A3 = 2 THEN S1(i) = S1(i) + 100: Q(i) = Q(i) + 1: M(R, C + 1) = i + 4: Y = R: X = C + 1: GOSUB 13100
6550   IF A4 = 2 THEN S1(i) = S1(i) + 100: Q(i) = Q(i) + 1: M(R, C - 1) = i + 4: Y = R: X = C - 1: GOSUB 13100
6600   IF S1(i) >= 3000 THEN T1 = i: GOSUB 10350
6650   M(R, C) = i + 4: Y = R: X = C: GOSUB 13100
6700   FOR i = 1 TO MaxComp
6701     B(P) = B(P) + INT(.05 * S(i, P) * S1(i))
6702   NEXT i
       KIndex(P) = KIndex(P) * 1.05
6703   KBonus = INT(KBonus * 1.05)
6705   IF DOUBLE.PAY = 1 THEN GOSUB 34000'DOUBLE PAYMENT
       IF SpecialHelp = 1 AND DOUBLE.PAY = 0 THEN GOSUB SpecialHelp
6710   IF TRAP = 1 THEN GOSUB TrapR
6716   IF RND <= .1 THEN GOSUB 35000
6720   IF FTRAP = 1 THEN GOSUB 33000: GOTO 7700'FREEZE TRAPED
6730   IF TRAP = 1 THEN 7700
6750   FOR i = 1 TO MaxComp
6800      IF Q(i) = 0 THEN 7650
6850      GOSUB 17800: X = 1: Y = MAXROW + 1: GOSUB 12900: GOSUB 21000
6900      IF B(P) < S1(i) THEN 7650
6950      COLOR 7 ', 1:
          MB = INT(B(P) / S1(i))
          MS = INT((MaxSell(P) - CurSell(P)) / S1(i))
          PRINT MX$(i); " at"; S1(i); " Hold"; S(i, P); " MB="; MB; "MS="; MS; : INPUT " Cmd #[S] "; R3$
          GOSUB 16250
7000      PRINT
7050   '
7100      IF LEFT$(R3$, 1) = "M" OR LEFT$(R3$, 1) = "m" THEN R3$ = "": GOSUB 13550: GOTO 6850
7110      IF LEFT$(R3$, 1) = "S" OR LEFT$(R3$, 1) = "s" THEN R3$ = "": GOSUB 38000: GOTO 6850
          IF LEFT$(R3$, 1) = "I" OR LEFT$(R3$, 1) = "i" THEN R$ = "": GOSUB InfoScreenR: GOTO 6850
7150      IF LEFT$(R3$, 1) = "H" OR LEFT$(R3$, 1) = "h" THEN R3$ = "": GOSUB 10600: GOTO 6850
7200      GOSUB 14300: IF i = MaxComp + 1 THEN 7650
7250      IF KI <> i AND KI > 0 AND KI < MaxComp + 1 AND Q(KI) <> 0 THEN i = KI: GOTO 6800
7300      ZR3 = VAL(R3$): FLG = 0
7350      FLG = INSTR(R3$, "S") + INSTR(R3$, "s"): IF FLG <> 0 THEN IF S(i, P) < ZR3 THEN GOTO 6850
          
7400      IF FLG <> 0 THEN
             IF MS < ZR3 THEN ZR3 = MS
             S(i, P) = S(i, P) - ZR3: R3$ = ""
             B(P) = INT(B(P) + ZR3 * S1(i) * .95)
             CurSell(P) = CurSell(P) + ZR3 * S1(i)
             GOSUB 16800
            ' GOTO 7650
          ELSE
7450        IF ZR3 * S1(i) <= B(P) THEN 7550
7500        X = 1: Y = MAXROW + 1: GOSUB 12900: GOSUB 21000: PRINT "You only have $"; B(P); "- Try again": GOTO 6850
7550        IF ZR3 = 0 THEN 7650
7600        S(i, P) = S(i, P) + ZR3: B(P) = B(P) - (ZR3 * S1(i)): GOSUB 16800
          END IF
7650   NEXT i
7655   IF B(P) > 2500 AND KBI$ <> "-" THEN GOTO 6750
7700 GOTO 3100
7750 F1 = A1 - 4
7800 F2 = A2 - 4
7850 IF F1 < 0 THEN F1 = 0
7900 IF F2 < 0 THEN F2 = 0
7950 F3 = A3 - 4
8000 IF F3 < 0 THEN F3 = 0
8050 F4 = A4 - 4
8100 IF F4 < 0 THEN F4 = 0
8150 T = Q(F1): T1 = F1
8200 IF Q(F2) > Q(F1) THEN T = Q(F2): T1 = F2
8250 IF Q(F3) > T THEN T = Q(F3): T1 = F3
8300 IF Q(F4) > T THEN T = Q(F4): T1 = F4
8350 IF F1 = T1 OR A1 < 5 THEN 8450
8400 X = F1: GOSUB 8800
8450 IF F2 = T1 OR A2 < 5 THEN 8550
8500 X = F2: GOSUB 8800
8550 IF F3 = T1 OR A3 < 5 THEN 8650
8600 X = F3: GOSUB 8800
8650 IF F4 = T1 OR A4 < 5 THEN 8750
8700 X = F4: GOSUB 8800
8750 RETURN
8800 ALARM = 2: GOSUB AlarmHndllerR: SY = Y: SX = X: Y = MAXROW + 1: X = 1: GOSUB 11300: Y = SY: X = SX: LOCATE MAXROW + 1, 1: COLOR 15 ', 8
8820 PRINT MX$(X); " Has just been merged into "; MX$(T1); "!"
8900 PRINT "Old stock = "; MX$(X); "    New stock = "; MX$(T1)
9000 PRINT "Player"; TAB(10); "Old Stock"; TAB(22); "New stock"; TAB(34);
9050 PRINT " Total Holdings"; TAB(53); "Bonus paid"
9060 S2 = 0: FOR i = 1 TO P1: S2 = S2 + S(X, i): NEXT i
9100 FOR i = 1 TO P1
9120    COLOR PAtr(i): PRINT P$(i); TAB(10); S(X, i); TAB(22); INT((.5 * S(X, i)) + .5);
9150    PRINT TAB(34); S(T1, i) + INT((.5 * S(X, i)) + .5);
9210    IF S2 = 0 THEN PRINT : GOTO 9300
9250    PRINT TAB(53); " $"; INT(10 * ((S(X, i) / S2) * S1(X)))
9300 NEXT i
9310 GOSUB KeyWaitR
9350 FOR i = 1 TO P1
9360   S(T1, i) = S(T1, i) + INT((.5 * S(X, i)) + .5)
9370   IF S2 = 0 THEN PRINT : GOTO 9410
9400   B(i) = B(i) + INT(10 * ((S(X, i) / S2) * S1(X)))
9410 NEXT i
9420 COLOR 15
9450 FOR i = 1 TO MAXROW
9455   FOR J = 1 TO MaxCol
9500   IF M(i, J) = X + 4 THEN M(i, J) = T1 + 4: SAVEX = X: SAVEY = Y: Y = i: X = J: GOSUB 13100: X = SAVEX: Y = SAVEY
9550   NEXT J
9555 NEXT i
9600 A1 = M(R - 1, C): A2 = M(R + 1, C): A3 = M(R, C + 1): A4 = M(R, C - 1)
9650 F1 = A1 - 4
9700 IF F1 < 0 THEN F1 = 0
9750 F2 = A2 - 4
9800 IF F2 < 0 THEN F2 = 0
9850 Q(T1) = Q(T1) + Q(X): S1(T1) = S1(T1) + S1(X)
9900 IF S1(T1) > 3000 THEN GOSUB 10350
9950 F3 = A3 - 4
10000 IF F3 < 0 THEN F3 = 0
10050 F4 = A4 - 4
10100 IF F4 < 0 THEN F4 = 0
10150 S1(X) = 100: Q(X) = 0: FOR i = 1 TO P1: S(X, i) = 0: NEXT i
10200 PRINT
10250 M(R, C) = T1 + 4
10300 RETURN
10350 SY = Y: SX = X: Y = MAXROW + 1: X = 1: GOSUB 11300: Y = SY: X = SX: LOCATE MAXROW + 2, 1: PRINT "The stock of ";
10400 PRINT MX$(T1); " has split 2 for 1!": S1(T1) = INT(S1(T1) / 2)
10450 PRINT
10500 FOR I1 = 1 TO P1
10505   S(T1, I1) = 2 * S(T1, I1)
10510 NEXT I1
10550 RETURN
10600 '*************************
10650 '* PRINT CURRENT HOLDING *
10700 '*************************
10710 SCREEN 12, 0, 0, 0: CLS
10720 IRow = 25 - Base2: ICol = 27: IAtr = PAtr(P): IStr$ = "Player " + P$(P) + " Holding": GOSUB XYAPrintR
10750 IRow = 28 - Base2: ICol = 0: IAtr = 15: IStr$ = "Stock": GOSUB XYAPrintR: ICol = 40: GOSUB XYAPrintR
10760        ICol = 21: IStr$ = "P.P.S.": GOSUB XYAPrintR: ICol = 61: GOSUB XYAPrintR
10770        ICol = 31: IStr$ = "Holding": GOSUB XYAPrintR: ICol = 71: GOSUB XYAPrintR
10900 IRow = 29 - Base2
10910 FOR I3 = 1 TO MaxComp STEP 2
10950   IF Q(I3) = 0 THEN 11050
11000   ICol = 0: IAtr = PAtr(NA(I3)): IStr$ = MX$(I3): GOSUB XYAPrintR
11010   ICol = 21: IStr$ = STR$(S1(I3)): GOSUB XYAPrintR
11020   ICol = 31: IStr$ = STR$(S(I3, P)): GOSUB XYAPrintR
11050   IF Q(I3 + 1) = 0 THEN 11150
11100   ICol = 40: IAtr = PAtr(NA(I3 + 1)): IStr$ = MX$(I3 + 1): GOSUB XYAPrintR
11110   ICol = 61: IStr$ = STR$(S1(I3 + 1)): GOSUB XYAPrintR
11120   ICol = 71: IStr$ = STR$(S(I3 + 1, P)): GOSUB XYAPrintR
11150   IRow = IRow + 1
11200 NEXT I3
11210 'IRow = ScreenRowSize: ICol = 0: IAtr = 7: IStr$ = "Press any key to return to Map Screen": GOSUB XYAPrintR
11220 IF INKEY$ = "" THEN 11220
      CLS : GOSUB 13550: GOSUB 16250
11250 SCREEN 12, 0, 0, 0: Y = ScreenRowSize - 2: X = 1: GOSUB 12900: COLOR 7: RETURN

11300 REM
11350 GOSUB 20000: COLOR 12 ', 1:
      LOCATE ScreenRowSize - 2, 1
11360 PRINT "Special Announcement!!": COLOR 15
11400 RETURN
11450 '
11480 GOSUB 11300: PRINT "The game is over - Here are the finle standings: "
11500 PRINT
11550 PRINT "Player"; TAB(10); "Cash value of stock"; TAB(33); "Cash on hand ";
11600 PRINT TAB(50); "Net worth": PRINT
11650 FOR i = 1 TO P1
11655   FOR J = 1 TO MaxComp
11660     D1(i) = D1(i) + (S1(J) * S(J, i))
11662   NEXT J
11663 NEXT i
11665 WIN.SUM = D1(1) + B(1): win.is = 1
      'LastShareValueIndex = ShareValueIndex
      'ShareValueIndex = 0
11667 FOR i = 1 TO P1
11670   T = D1(i) + B(i)
        'ShareValueIndex = ShareValueIndex + T
        IF T > WIN.SUM THEN WIN.SUM = T: win.is = i
11680 NEXT i
      'ShareValueIndex = ShareValueIndex / P1
11700 FOR i = 1 TO P1
11705   COLOR PAtr(i): IF i = win.is THEN COLOR PAtr(i): PRINT "Winner "; '+ 16
11710   PRINT P$(i); TAB(10); "$"; D1(i); TAB(33); "$"; B(i);
11720   PRINT TAB(50); "$"; D1(i) + B(i): D1(i) = 0
11750 NEXT i
11760 COLOR 15 ', 0:
      PRINT : PRINT "<<<<< The Winner is "; P$(win.is); " >>>>>"
11770 PRINT "Game start at "; START.TIME$; " and ended at "; TIME$: PRINT : PRINT
Update.all:
    IF Record.Score = 0 THEN GOTO 11800
    'input "win is";win.is
    FOR i = 1 TO P1
      ptr = 0
      FOR J = 1 TO frec
        GET #1, J
        IF P$(i) = Player.Names$ THEN ptr = J
      NEXT J
      GOSUB Update.sqr
    NEXT i
    GOSUB print.sqr
    CLOSE #1
11800 PRINT "Hit any 3 keys when ready to return to DOS system"; : R$ = INPUT$(3)
11900 END
Update.sqr:
    IF ptr = 0 THEN ptr = frec + 1: frec = frec + 1
    GET #1, ptr
    LSET Player.Names$ = P$(i)
    IF win.is = i THEN LSET Player.Win$ = STR$(VAL(Player.Win$) + 1)
    LSET Number.Games$ = STR$(VAL(Number.Games$) + 1)
    IF win.is = i THEN LSET Game.Date$ = DATE$ + " " + TIME$
    PUT #1, ptr
    RETURN

print.sqr:
    PRINT "┌─────────────────────────────────────────────────────────────┐"
    PRINT "│ Player Name   Win Count   Games   Score%   Game Date & Time │"
    IF frec = 0 THEN GOTO print.sqr1
    FOR i = 1 TO frec
      GET #1, i
      Player.Score$ = STR$(INT(VAL(Player.Win$) / VAL(Number.Games$) * 100))
      PRINT "│ "; Player.Names$; TAB(17); Player.Win$; TAB(29); Number.Games$;
      PRINT TAB(37); Player.Score$; TAB(47); Game.Date$; "│"
    NEXT i
print.sqr1:
    PRINT "└─────────────────────────────────────────────────────────────┘"
    PRINT : PRINT
    RETURN
12650 '
12700 'SET CURSOR TO POS X*OS YPOS ON THE METRIX
12750 '
12800 X = POSX + POSX: Y = POSY
12850 '
12900 'MOVE  CURSOR TO X,Y POSITION ON SCREEN
12950 '
13000 LOCATE Y, X: RETURN
13100 '
13150 'UPDATE POS ON SCREEN
13200 '***********************
13250 'ON ENTRY X,Y POS THAT NEED UPDATING
13300 ROW1 = Y: COL1 = X: R2 = Y: C2 = X
13350 X = (X - 1) * 2 + 2: GOSUB 12850: TC$ = MID$(L$, M(ROW1, COL1), 1)
13400 IF TC$ < "@" THEN PRINT TC$; : RETURN
13450 GOSUB 15100: GOSUB 12850: PRINT TC$;
13500 RETURN
13550 '**********************
13600 '*  PRINT SCREEN MAP  *
13650 '**********************
13700 IRow1 = 0: IRow2 = MAXROW: ICol1 = 0: ICol2 = MaxCol * 2: IAtr = 0: GOSUB CLRAREA: ' CALL CLRAREA(Irow1, ICol1, IRow2, Icol2, IAtr)
13710 IRow = 0: ICol = 0: IAtr = 15
13750 GOSUB 17250: IStr$ = " "
13800 FOR R2 = 1 TO MAXROW
13810   IRow = R2 - 1
13900   FOR C2 = 1 TO MaxCol
13910     ICol = C2 + C2 - 1
13950     LSET IStr$ = MID$(L$, M(R2, C2), 1)
13960     IF IStr$ > "@" THEN IAtr = COMPATR(ASC(IStr$) - 64): GOTO 14010
14000     IAtr = 15: IF IStr$ = "" THEN IAtr = 14
14010     GOSUB XYAPrintR
14050   NEXT C2
14150 NEXT R2
14200 LOCATE MAXROW + 1, 1: COLOR 15 ', 8
14250 RETURN
14300 KI = i: KBI$ = LEFT$(R3$, 1): IF LEFT$(R3$, 1) <> "," AND LEFT$(R3$, 1) <> "." THEN 14350
14320 IF LEN(R3$) < 2 THEN R3$ = "-" ELSE i$ = MID$(R3$, 2, 1): KI = ASC(i$) - 64: R3$ = MID$(R3$, 3, (LEN(R3$) - 2))
14350 IF KI < 1 OR KI > MaxComp THEN R3$ = "-"
14400 IF LEFT$(R3$, 1) = "-" THEN i = MaxComp + 1: R3$ = MID$(R3$, 2, (LEN(R3$) - 1)): RETURN
14450 RETURN
14500 '*******************************
14550 ' GET PLAYER WITH MAX HOLDING   *
14600 '*******************************
14650 '
14700 FOR PP = 1 TO P1
14705   HOLD(PP) = PP
14710 NEXT PP
14750 IF P1 = 1 THEN 15050
14800 FLAG1 = 0: PP = 1
14850 '
14900 HT1 = S(COMP, HOLD(PP)): HT2 = S(COMP, HOLD(PP + 1)): IF HT1 >= HT2 THEN 14950
14920 HT1 = HOLD(PP): HT2 = HOLD(PP + 1): HOLD(PP + 1) = HT1: HOLD(PP) = HT2: FLAG1 = 1
14950 PP = PP + 1: IF PP < P1 THEN 14850
15000 IF FLAG1 = 1 THEN 14800
15050 MAXHOLD = HOLD(1): RETURN
15100 '*************************
15150 '* PRINT COMPANY AT CODE *
15200 '*************************
15250 '
15300 TC$ = MID$(L$, M(R2, C2), 1)
15350 COMP = M(R2, C2) - 4: IF COMP <= 0 THEN RETURN
15400 'IF COMP<>I THEN 15550
15450 GOSUB 14500
15500 NA(COMP) = MAXHOLD
      PATR1 = PAtr(NA(COMP)): IF S(COMP, MAXHOLD) = 0 THEN PATR1 = 7
      COMPATR(COMP) = PATR1
15550 COLOR PATR1 ', 0:
      RETURN
15600 '**************************
15650 '* GALETIC BOMB ACTION    *
15700 '**************************
15750 GOSUB 16210: GOSUB 16210: GOSUB 16210'Gold Star
15800 GB = INT(15 * RND)
15850 IF GB < 7 OR GB > 13 THEN RETURN
15900 QQQ = 1
15950 IF QQQ >= 5 THEN RETURN
16000 GBC = INT(1 + MaxComp * RND): IF Q(GBC) = 0 OR S1(GBC) <= 100 THEN QQQ = QQQ + 1: GOTO 15950
16050 X = 1: Y = 23: GOSUB 12900: GOSUB 11300
16100 STS = INT(1 + 19 * RND): PRINT MX$(GBC); MSG$(STS); GB(STS) * 100; "%";
16150 S1(GBC) = INT(S1(GBC) + S1(GBC) * GB(STS))
16180 IF GB(STS) <= 0 THEN ALARM = 2
16190 IF GB(STS) >= 0 THEN ALARM = 3
16195 IF GB(STS) <= -.3 THEN ALARM = 1
16200 GOTO AlarmHndllerR
16210 '
16220 Y = INT(1 + RND * MAXROW): X = INT(1 + RND * MaxCol)
16230 IF M(Y, X) <> 4 THEN RETURN
16240 M(Y, X) = 1: ALARM = 1: GOSUB AlarmHndllerR: GOSUB 13100: X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOSUB 11300
16242 COLOR 14 ', 1:
      PRINT "Gold star disappear from Galaxcey Map"; : COLOR 7 ', 1:
      RETURN
16250 '**************************
16300 '*   PRINT VALUE OF STOCK *
16350 '**************************
16360 COLOR 15 ', 1:
      X = 80 - 3: Y = 1: GOSUB 12900: PRINT USING "###"; K;
16400 X = MaxCol * 2 + 2: Y = 1: GOSUB 12900: COLOR 15: PRINT "Player  NET Value";
16450 FOR Ii = 1 TO P1
        D1(Ii) = 0
16500   FOR J = 1 TO MaxComp
          D1(Ii) = D1(Ii) + S1(J) * S(J, Ii)
        NEXT J
        T.Val(Ii) = D1(Ii) + B(Ii)
        MaxSell(Ii) = T.Val(Ii) * .3
16550   X = MaxCol * 2 + 2: Y = 1 + Ii: GOSUB 12900: COLOR PAtr(Ii): PRINT P$(Ii);
16600   X = MaxCol * 2 + 9: Y = 1 + Ii: GOSUB 12900: PRINT USING "############# ##"; T.Val(Ii); Dp(Ii); : COLOR 7
16650   D1(Ii) = 0
16660 NEXT Ii
      Scale.Val = T.Val(1)
      ShareValueIndex = 0
16670 FOR Ii = 1 TO P1
        ShareValueIndex = ShareValueIndex + T.Val(Ii)
16680   IF T.Val(Ii) > Scale.Val THEN Scale.Val = T.Val(Ii): Player.First = Ii
16690 NEXT Ii
      ShareValueIndex = ShareValueIndex / P1
16700 FOR Ii = 1 TO P1
16710   ICol = 0: IRow = (ScreenRowSize - P1 + -4) + Ii: IAtr = PAtr(Ii): ILL = INT(78 * T.Val(Ii) / Scale.Val): IF ILL < 1 THEN ILL = 1
16720   IStr$ = STRING$(ILL, CHR$(254)) + SYM$(Ii) + STRING$(78 - ILL, " "): GOSUB XYAPrintR
16730 NEXT Ii
16750 RETURN
16800 '************************
16850 '*  UPDATE SINGLE COMP. *
16900 '************************
16950 FOR R2 = 1 TO MAXROW
17000   FOR C2 = 1 TO MaxCol
17050     GOSUB 15100
17060     IF COMP = i THEN POSY = R2: POSX = C2: GOSUB 12650: PRINT TC$;
17100   NEXT C2
17150 NEXT R2
17200 RETURN
17250 '*******************************
17300 '* UPDATE HOLDING STRING       *
17350 '*******************************
17400 '
17450 FOR COMP = 1 TO MaxComp
17500   IF Q(COMP) = 0 THEN 17700
17550   TC$ = MID$(M$, COMP, 1)
17600   GOSUB 14500
17650   NA(COMP) = MAXHOLD
17700 NEXT COMP
17750 RETURN
17800 '***************************
17850 '*  PRINT NAME CASH        *    P=Current Player
17900 '***************************
17950 X = MaxCol * 2 + 2: Y = P1 + 3: GOSUB 12900: COLOR 15: PRINT "Player  Cash Holding";
      FOR Ii = 1 TO P1
18000   X = MaxCol * 2 + 2: Y = P1 + 3 + Ii: GOSUB 12900: COLOR 15', 8:
        GOSUB 21000
18010   COLOR PAtr(Ii)
18020   PRINT P$(Ii);
18050   X = MaxCol * 2 + 9: Y = P1 + Ii + 3: GOSUB 12900: COLOR 15: PRINT USING "#############"; B(Ii); : COLOR 7
      NEXT Ii
      X = MaxCol * 2 + 2: Y = P1 + Ii + 4: GOSUB 12900: COLOR 15: PRINT "Bank Cash";
   '   X = MaxCol * 2 + 2: Y = P1 + Ii + 5: GOSUB 12900: COLOR 15', 8:
   '   GOSUB 21000
      X = MaxCol * 2 + 9: Y = P1 + Ii + 5: GOSUB 12900: COLOR 15: PRINT USING "#############"; KBonus; : COLOR 7
      X = MaxCol * 2 + 2: Y = P1 + Ii + 6: GOSUB 12900: COLOR 15: PRINT "Now Playing: ";
      'X = MaxCol * 2 + 2: Y = P1 + Ii + 7: GOSUB 12900
      COLOR PAtr(P): PRINT P$(P);
18100 RETURN
20000 '***************************
20050 '*  CLEAR TO END OF SCREEN *
20100 '***************************
20150 COLOR 15: IAtr = 15: IRow = Y - 1: ICol = X - 1: IStr$ = STRING$(80 - X, " "): GOSUB XYAPrintR
20200 IStr$ = STRING$(79, " ")
20210 IF Y < 17 THEN IRow1 = Y: ICol1 = 0: IRow2 = 16: ICol2 = 79: GOSUB CLRAREA: ' CALL CLRAREA(Irow1, ICol1, IRow2, Icol2, IAtr)
20220 IRow1 = 17 + P1: ICol1 = 0: IRow2 = ScreenRowSize - 1: ICol2 = 79: : GOSUB CLRAREA: 'CALL CLRAREA(Irow1, ICol1, IRow2, Icol2, IAtr)
20230 LOCATE Y, X: RETURN
21000 '***************************
21050 '*  CLEAR TO END OF LINE   *
21100 '***************************
21150 IRow = Y - 1: ICol = X - 1: IAtr = 15: IStr$ = STRING$(80 - X, " "): GOSUB XYAPrintR: LOCATE Y, X: RETURN

KeyWaitR: '<<<WAIT FOR KEY PRESS>>>
      COLOR 7: ' PRINT "Press any key to continue";
      WHILE INKEY$ = "": WEND
      RETURN

AlarmHndllerR: ' <<< Alarm handller >>>
30020 ON ALARM GOTO 30050, 30400, 30950
30050 '<<< Cirena sound >>>
30100 FOR ALM = 440 TO 1000 STEP 10: SOUND ALM, .5: NEXT ALM
30250 FOR ALM = 1000 TO 440 STEP -10: SOUND ALM, .5: NEXT ALM: RETURN
30400 '
30450 '<<< Sound short alarm >>>
30500 FOR ALMJ = 1 TO 3: FOR ALM = 300 TO 1400 STEP 100: SOUND ALM, 1: NEXT ALM
30550 FOR ALM = 1400 TO 300 STEP -100: SOUND ALM, .5: NEXT ALM: NEXT ALMJ: RETURN
30950 '
31000 '<<< Sound Alarm bell >>>
31050 FOR ALM = 1 TO 6: SOUND 440, .5: SOUND 880, 1: SOUND 440, .5: NEXT ALM: RETURN
      '***************************************
TrapR: ' <<<  TRAPED YOU LOST YOUR CASH MONEY  >>>
32150 X = 1: Y = ScreenRowSize - 1: GOSUB 12900: GOSUB 11300
      DF = 0: IF RND > .65 THEN DF = .5
32200 IF DF = 0 THEN KLost = B(P): PRINT "Traped !!!!! Lost your cash money  ";
32210 IF DF > 0 THEN KLost = B(P) * DF: PRINT "Traped !!!!! Lost 1/2 of your cash money  ";
      KBonus = KBonus + KLost
      B(P) = B(P) - KLost
      Pay = -1 * KLost
      GOSUB ComputePersonalIndexCange
32250 ALARM = 1: GOSUB AlarmHndllerR: GOSUB AlarmHndllerR: GOSUB 17800: X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOTO KeyWaitR
      '**************************************
      '*       SPECIAL-HELP                 *
      '**************************************
SpecialHelp:
      SpecialHelp = 0
      X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOSUB 11300
      Pay = T.Val(Player.First) * .18
      GOSUB ComputePersonalIndexCange
      B(P) = B(P) + Pay: Dp(P) = Dp(P) + 1
      COLOR 9: PRINT "Special Help Additional 18% of Leading Player holding BONUS !!!!!!  ";
      ALARM = 1: GOSUB AlarmHndllerR: GOSUB 17800: X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOTO KeyWaitR
33000 '***************************************
33050 '* FREEZE TRAPED YOU LOST CURRENT GAME *
33100 '***************************************
33150 X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOSUB 11300
33200 PRINT "Freeze Traped !!!!! Lost your current game  ";
33250 ALARM = 1: GOSUB AlarmHndllerR: X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOTO KeyWaitR
34000 '*********************
34050 '*   DOUBLE PAYMENT  *
34100 '*********************
34150 X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOSUB 11300
      Pay = B(P)
      GOSUB ComputePersonalIndexCange
      B(P) = B(P) + Pay
      Dp(P) = Dp(P) + 1
34200 PRINT "Double Payment !!!!!  ";
34250 ALARM = 1: GOSUB AlarmHndllerR: GOSUB AlarmHndllerR: GOSUB 17800: X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOTO KeyWaitR
35000 '*********************
35050 '*   BONUS  PAYMENT  *
35100 '*********************
35150 X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOSUB 11300
      Pay = KBonus * .5
      GOSUB ComputePersonalIndexCange
      B(P) = B(P) + Pay
      KBonus = KBonus - Pay
35200 PRINT "Bonus Payment of "; KBonus;
35250 ALARM = 1: GOSUB AlarmHndllerR: GOSUB AlarmHndllerR: GOSUB 17800: X = 1: Y = ScreenRowSize - 2: GOSUB 12900: GOTO KeyWaitR
36000 '************************
36100 ' TIMER DISPLAY ROUTINE *
36150 '************************
36200 OLDCOL = POS(0): OLDROW = CSRLIN: LOCATE 1, 73: PRINT TIME$; : LOCATE OLDROW, OLDCOL: RETURN
37000 '************************
37100 ' Get k.b. data         *
37150 '************************
37300 R$ = ""
37350 KB.DATA$ = INKEY$
37400 IF KB.DATA$ = "" THEN 37350
37450 IF KB.DATA$ = CHR$(13) THEN 37600
37500 R$ = R$ + KB.DATA$: PRINT KB.DATA$; : GOTO 37350
37600 PRINT : RETURN
38000 '************************
38100 ' Change game steps     *
38150 '************************
38160 X = 1: Y = MAXROW + 1: GOSUB 12900: GOSUB 21000: COLOR 7   ', 1
38200 PRINT "Current game step is"; Game.Steps; : INPUT " Enter new Game Steps "; GG
38250 PRINT : IF GG = 0 OR GG <= K OR GG > 240 THEN BEEP: GOTO 38400
38300 Game.Steps = GG
38400 RETURN

XYAPrintR: '<<< Print at location IROW,ICOL ,IATR,ISTR$ >>>
           ' Assmbly old Routine CALL PRSTR(IROW, ICOL, IATR, ISTR$): RETURN
             LOCATE IRow + 1, ICol + 1: COLOR IAtr: PRINT IStr$; : RETURN

CLRAREA:   '<<< Clear Area Routine >>>
           ' Assmbly old routine CALL CLRAREA(IROW1, ICOL1, IROW2, ICOL2, IAtr)
          Blstr$ = STRING$(ICol2 - ICol1 + 1, " ")
          FOR ClrAreaPointer = IRow1 TO IRow2
              LOCATE ClrAreaPointer + 1, ICol1 + 1
              COLOR IAtr
              PRINT Blstr$;
          NEXT ClrAreaPointer
          RETURN

InfoScreenR:
       SCREEN 12, 0, 0, 0: CLS
         COLOR PAtr(P)
         PRINT STRING$(29, " ") + "I n f o    S c r e e n"
         COLOR 15
         PRINT "Player      Total Value        Max Worth of Selling       Left for Selling"
         FOR Ii = 1 TO P1
             'IRow = 3 + Ii: ICol = 1:
             IAtr = PAtr(Ii)
             COLOR IAtr
             PRINT P$(Ii);
             PRINT USING "   ############"; T.Val(Ii);
             PRINT USING "                ############"; MaxSell(Ii);
             PRINT USING "           ############"; MaxSell(Ii) - CurSell(Ii);
             PRINT
             'GOSUB XYAPrintR
       NEXT Ii
       COLOR 15
       PRINT : PRINT
       PRINT "Last    Index Was:"; LastShareValueIndex
       PRINT "Current Index  Is:"; ShareValueIndex
       PRINT USING "Index Gain at % :############.##"; 100 * (ShareValueIndex / 6000) - 100;
       PRINT : PRINT
         PRINT "Player      Personal Bonus Index"
         FOR Ii = 1 TO P1
             COLOR PAtr(Ii)
             PRINT P$(Ii);
             PRINT USING "   ############.##"; KIndex(Ii);
             PRINT
       NEXT Ii
       COLOR 15

  '     IRow = 25 - Base2: ICol = 27: Iatr = PAtr(P): IStr$ = "Player " + P$(P) + " Holding": GOSUB XYAPrintR
  '     IRow = 28 - Base2: ICol = 0: Iatr = 15: IStr$ = "Stock": GOSUB XYAPrintR: ICol = 40: GOSUB XYAPrintR
  '     ICol = 21: IStr$ = "P.P.S.": GOSUB XYAPrintR: ICol = 61: GOSUB XYAPrintR
  '     ICol = 31: IStr$ = "Holding": GOSUB XYAPrintR: ICol = 71: GOSUB XYAPrintR
  '     IRow = 29 - Base2
       WHILE INKEY$ = "": WEND
       CLS : GOSUB 13550: GOSUB 16250
       SCREEN 12, 0, 0, 0: Y = ScreenRowSize - 2: X = 1: GOSUB 12900: COLOR 7
       RETURN

ComputePersonalIndexCange:
      KIndexChange = 1 + Pay / ShareValueIndex
      KIndex(P) = KIndex(P) * KIndexChange
      RETURN
50000 '<<<<< ERROR ROUTINE >>>>>
50100 'LOCATE 25,60 :PRINT "Err=";ERR;"  "Erl=";ERL;:RESUME

