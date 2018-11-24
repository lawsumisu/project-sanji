[Remap]
x = x
y = y
z = z
a = a
b = b
c = c
s = s

[Defaults]
; Default value for the "time" parameter of a Command. Minimum 1.
command.time = 15

; Default value for the "buffer.time" parameter of a Command. Minimum 1,
; maximum 30.
command.buffer.time = 1

;------------------------------------
; Quarter-Circle Forward + a
[Command]
name = "QCF_a"
command = ~D, DF, F, ~a
time = 12

[Command]
name = "QCF_a"
command = ~D, DF, F, a
time = 12

[Command]
name = "QCF_a"
command = ~D, F, a
time = 12

;------------------------------------
; Quarter-Circle Forward + x
[Command]
name = "QCF_x"
command = ~D, DF, F, ~x
time = 12

[Command]
name = "QCF_x"
command = ~D, DF, F, x
time = 12

[Command]
name = "QCF_x"
command = ~D, F, x
time = 12

;------------------------------------
; Quarter-Circle Forward + y
[Command]
name = "QCF_y"
command = ~D, DF, F, ~y
time = 12

[Command]
name = "QCF_y"
command = ~D, DF, F, y
time = 12

[Command]
name = "QCF_y"
command = ~D, F, y
time = 12

;------------------------------------
; Quarter-Circle Forward + b
[Command]
name = "QCF_b"
command = ~D, DF, F, ~b
time = 12

[Command]
name = "QCF_b"
command = ~D, DF, F, b
time = 12

[Command]
name = "QCF_b"
command = ~D, F, b
time = 12
;-| Double Tap |-----------------------------------------------------------
[Command]
name = "FF"     ;Required (do not remove)
command = F, F
time = 10

[Command]
name = "BB"     ;Required (do not remove)
command = B, B
time = 10

[Command]
name = "DD"     
command = $D,$D
time = 10

;-| 2/3 Button Combination |-----------------------------------------------
[Command]
name = "recovery";Required (do not remove)
command = x+y
time = 1

[Command]
name = "B_Throw"
command = /$B,x+a
time = 10

[Command]
name = "F_Throw"
command = x+a
time = 10

[Command]
name = "F_Dash"
command = /$F, x+y
time = 1

[Command]
name = "B_Dash"
command = /$B, x+y
time = 1

[Command]
name = "Cancel"
command = /$D, x+y
time = 1
;-| Dir + Button |---------------------------------------------------------
[Command]
name = "down_a"
command = /$D,a
time = 1

[Command]
name = "down_b"
command = /$D,b
time = 1

;-| Single Button |---------------------------------------------------------
[Command]
name = "a"
command = a
time = 1

[Command]
name = "b"
command = b
time = 1

[Command]
name = "c"
command = c
time = 1

[Command]
name = "x"
command = x
time = 1

[Command]
name = "y"
command = y
time = 1

[Command]
name = "z"
command = z
time = 1

[Command]
name = "start"
command = s
time = 1

;-| Hold Dir |--------------------------------------------------------------
[Command]
name = "holdfwd";Required (do not remove)
command = /$F
time = 1

[Command]
name = "holdback";Required (do not remove)
command = /$B
time = 1

[Command]
name = "holdup" ;Required (do not remove)
command = /$U
time = 1

[Command]
name = "holddown";Required (do not remove)
command = /$D
time = 1

; Don't remove the following line. It's required by the CMD standard.
[Statedef -1]
[State -1, Base Run Light]
type = ChangeState
value = 400
trigger1 = command = "QCF_x"
trigger1 = statetype = S
trigger1 = ctrl

[State -1, Base Run Medium]
type = ChangeState
value = 401
trigger1 = command = "QCF_y"
trigger1 = statetype = S
trigger1 = ctrl

[State -1, Base Run Heavy]
type = ChangeState
value = 402
trigger1 = command = "QCF_b"
trigger1 = statetype = S
trigger1 = ctrl

[State -1, Base Run Cancel]
type = ChangeState
value = 404
triggerall = stateno = [400,402]
trigger1 = command = "DD"
trigger2 = command = "Cancel"


[State -1, Dash Forward]
type = ChangeState
value = 104
triggerall = ctrl && statetype = S
trigger1 = command = "FF"
trigger2 = command = "F_Dash"

[State -1, Dash Back]
type = ChangeState
value = 105
triggerall = ctrl && statetype = S
trigger1 = command = "BB"
trigger2 = command = "B_Dash"

[State -1, Fast Ball]
type = ChangeState
value = 510
triggerall = command = "QCF_a"
trigger1 = ctrl
trigger1 = statetype = S

[State -1, Backwards Grab]
type = ChangeState
value = 701
trigger1 = command = "B_Throw"
trigger1= statetype = S
trigger1 = ctrl

[State -1, Forward Grab]
type = ChangeState
value = 700
trigger1 = command = "F_Throw"
trigger1= statetype = S
trigger1 = ctrl

[State -1, Ball Toss]
type = ChangeState
value = 500
triggerall = Var(2) < 1  
triggerall = command = "a"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl

[State -1, Standing Light]
type = ChangeState
value = 200
triggerall = command = "x"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = stateno = 200
trigger2 = time > 8

[State -1, Standing Medium]
type = ChangeState
value = 201
triggerall = command = "y"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = stateno = 200
trigger2 = MoveContact

[State -1, Standing Heavy]
type = ChangeState
value = 202
triggerall = command = "b"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = stateno = 201
trigger2 = MoveContact

;Crouching Roundhouse
[State -1, Crouching Light]
type = ChangeState
value = 300
triggerall = command = "x" || command = "y"
triggerall = command = "holddown"
trigger1 = statetype = C && ctrl

;Crouching Roundhouse
;[State -1, Crouching Heavy]
;type = ChangeState
;value = 310
;triggerall = command = "y"
;triggerall = command = "holddown"
;trigger1 = statetype = C && ctrl

;Crouching Roundhouse
[State -1, Crouching Heavy]
type = ChangeState
value = 310
triggerall = command = "b" 
triggerall = command = "holddown"
trigger1 = statetype = C && ctrl

;----------------------------------------------------------------------
[State -1, Jumping Light]
type = ChangeState
value = 600
triggerall = command = "x"
trigger1 = statetype = A
trigger1 = ctrl

;----------------------------------------------------------------------
[State -1, Jumping Medium]
type = ChangeState
value = 610
triggerall = command = "y"
trigger1 = statetype = A
trigger1 = ctrl

;----------------------------------------------------------------------
[State -1, Jumping Heavy]
type = ChangeState
value = 620
triggerall = command = "b"
trigger1 = statetype = A
trigger1 = ctrl
;---------------------------------------------------------------------
