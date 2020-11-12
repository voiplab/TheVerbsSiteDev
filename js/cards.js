// noinspection JSUnusedGlobalSymbols
window.cards = {
    scaleMultiplier: 0.08,
    elementsMargin: 15,
    velocity: 0.3,

    init: (firstRender, swipes) => {
        const cardsBlock = document.getElementById('stacked-cards-block');
        cards.stackedCards = cardsBlock.querySelector('.stackedcards-container');
        cards.overlays = cardsBlock.querySelector('.stackedcards-overlays');

        if (firstRender) {
            cards.initEvents(cardsBlock);
        }

        if (Object.keys(swipes).length === 0) {
            return;
        }

        cards.initCards();
        cards.initSwipes(swipes);
        cards.moveOverlaysToBack();

        const lastCardIdChanged = !cards.prevLastCardId || (cards.lastCard && cards.prevLastCardId !== cards.lastCard?.id);
        if (lastCardIdChanged) {
            cards.transformUi(0, cards.swipes['Top'].extremePosX, cards.swipes['Top'].extremePosY, 0, false, cards.lastCard, true);
            cards.prevLastCardId = cards.lastCard?.id;
        }

        cards.resetCards();

        cards.allowSwipes = true;
    },

    initCards: () => {
        cards.firstCard = cards.stackedCards.children[0];
        cards.lastCard = cards.stackedCards.children[cards.stackedCards.children.length - 1];
    },

    initSwipes: (swipes) => {
        cards.swipes = {};
        let createSwipe = (extremePosX, extremePosY, overlay, isAllowed, isMoveOn) => {
            let cardSwipe = Object.create(null);

            cardSwipe.extremePosX = extremePosX;
            cardSwipe.extremePosY = extremePosY;
            cardSwipe.overlay = overlay;
            cardSwipe.isAllowed = isAllowed;
            cardSwipe.isMoveOn = isMoveOn;

            return cardSwipe;
        };

        const extremeVerticalPosition = window.screen.availHeight;
        const extremeHorizontalPosition = window.screen.availWidth;

        function* entries(obj) {
            for (let key of Object.keys(obj)) {
                yield [key, obj[key]];
            }
        }

        for (let [swipeName, swipe] of entries(swipes)) {
            let extremePosX = 0;
            let extremePosY = 0;
            switch (swipeName) {
                case 'Left':
                    extremePosX = -extremeHorizontalPosition;
                    break;
                case 'Right':
                    extremePosX = extremeHorizontalPosition;
                    break;
                case 'Top':
                    extremePosY = -extremeVerticalPosition;
                    break;
            }
            const overlay = cards.overlays.querySelector(`.${swipeName.toLowerCase()}`);
            cards.swipes[swipeName] = createSwipe(extremePosX, extremePosY, overlay, swipe.isAllowed, swipe.isMoveOn);
        }
    },

    initEvents: (cardsBlock) => {
        let topOpacity;
        let rightOpacity;
        let leftOpacity;
        let startTime;
        let startX;
        let startY;
        let currentY;
        let currentX;
        let translateX;
        let translateY;
        let touchingElement = false;

        let setOverlayOpacity = () => {
            topOpacity = 0;
            rightOpacity = 0;
            leftOpacity = 0;

            const YOpacity = Math.abs(
                (((translateY + (cardsBlock.offsetHeight / 4)) /
                    (cardsBlock.offsetHeight / 5))));
            const XOpacity = Math.abs(
                translateX / (cardsBlock.offsetWidth / 2));
            let avgOpacity = Math.min((YOpacity + XOpacity) / 2, 1);

            if (avgOpacity === 0) {
                return;
            }

            if (translateY < -(cardsBlock.offsetHeight / 4) &&
                translateX > ((cards.stackedCards.offsetWidth / 2) * -1) &&
                translateX < ((cards.stackedCards.offsetWidth / 2))) {
                topOpacity = avgOpacity;
                return;
            }

            if (translateX > 0) {
                rightOpacity = avgOpacity;
                return;
            }

            leftOpacity = avgOpacity;
        }
        let gestureStart = (evt) => {
            if (!cards.allowSwipes) {
                return;
            }
            touchingElement = true;
            cards.moveOverlaysToFront();
            startTime = new Date().getTime();

            currentX = startX = evt.changedTouches[0].clientX;
            currentY = startY = evt.changedTouches[0].clientY;
        };
        let gestureMove = (evt) => {
            if (!touchingElement || !cards.allowSwipes) {
                return;
            }
            cards.moveOverlaysToFront();
            evt.preventDefault();

            currentX = evt.changedTouches[0].pageX;
            currentY = evt.changedTouches[0].pageY;

            translateX = currentX - startX;
            translateY = currentY - startY;

            setOverlayOpacity();

            cards.transformUi(1, translateX, translateY, 1, true, cards.firstCard, true);
            cards.transformUi(1, translateX, translateY, topOpacity, true, cards.swipes['Top'].overlay, true);
            cards.transformUi(1, translateX, translateY, leftOpacity, true, cards.swipes['Left'].overlay, true);
            cards.transformUi(1, translateX, translateY, rightOpacity, true, cards.swipes['Right'].overlay, true);
        }
        let gestureEnd = () => {
            cards.moveOverlaysToBack();
            if (!touchingElement || !cards.allowSwipes) {
                return;
            }

            touchingElement = false;
            const timeTaken = new Date().getTime() - startTime;
            translateX = currentX - startX;
            translateY = currentY - startY;
            setOverlayOpacity();

            let backToMiddle = () => {
                cards.moveOverlaysToBack();
                cards.transformUi(1, 0, 0, 1, true, cards.firstCard);
            };

            if (cards.swipes['Top'].isAllowed &&
                (translateY < ((cardsBlock.offsetHeight / 3) * -1)
                    && translateX > ((cards.stackedCards.offsetWidth / 2) * -1)
                    && translateX < (cards.stackedCards.offsetWidth / 2))) {  //is Top?
                if (translateY < ((cardsBlock.offsetHeight / 3) * -1)
                    || (Math.abs(translateY) / timeTaken > cards.velocity)) {
                    cards.slideAndSwipeAction('Top');
                } else {
                    backToMiddle();
                }
            } else {
                if (translateX < 0) {
                    if (cards.swipes['Left'].isAllowed &&
                        (translateX < ((cards.stackedCards.offsetWidth / 2) * -1) || (Math.abs(translateX) / timeTaken > cards.velocity))) {
                        cards.slideAndSwipeAction('Left');
                    } else {
                        backToMiddle();
                    }
                } else if (translateX > 0) {
                    if (cards.swipes['Right'].isAllowed &&
                        (translateX > (cards.stackedCards.offsetWidth / 2) && (Math.abs(translateX) / timeTaken > cards.velocity))) {
                        cards.slideAndSwipeAction('Right');
                    } else {
                        backToMiddle();
                    }
                }
            }
        };

        let buttonLeft = document.querySelector('.left-action');
        let buttonTop = document.querySelector('.top-action');
        let buttonRight = document.querySelector('.right-action');

        cardsBlock.addEventListener('touchstart', gestureStart, false);
        cardsBlock.addEventListener('touchmove', gestureMove, false);
        cardsBlock.addEventListener('touchend', gestureEnd, false);
        buttonLeft.addEventListener('click', _ => cards.onActionByDirection('Left'), false);
        buttonTop.addEventListener('click', _ => cards.onActionByDirection('Top'), false);
        buttonRight.addEventListener('click', _ => cards.onActionByDirection('Right'), false);
    },

    onActionByDirection: (directionName, force) => {
        if (!cards.allowSwipes) {
            return;
        }

        cards.allowSwipes = false;

        const swipe = cards.swipes[directionName];
        if (!swipe.isAllowed && !force) {
            return;
        }

        let overlay = cards.swipes[directionName].overlay;

        cards.moveOverlaysToFront();
        cards.transformUi(1, 0, 0, 0.8, false, overlay, true);
        setTimeout(() => {
            if (swipe.isMoveOn) {
                cards.slideAndSwipeAction(directionName);
            } else {
                cards.swipeAction(directionName);
            }
        }, 500);
    },

    swipeAction: (directionName) => {
        setTimeout(async () => {
            cards.transformUi(1, 0, 0, 0, true, cards.firstCard, true);
            await userScope.swipe(cards.firstCard.id, directionName);
        }, 300);
    },

    slideAndSwipeAction: (directionName) => {
        cards.allowSwipes = false;

        cards.slideToExtremePosition(directionName);

        cards.swipeAction(directionName);
    },

    moveOverlaysToBack: () => {
        for (let i = 0; i < cards.overlays.children.length; i++) {
            cards.transformUi(1, 0, 0, 0, false, cards.overlays.children[i], false);
            setTimeout(() => {
                cards.overlays.children[i].style.zIndex = '0';
            }, 300);
        }
    },

    moveOverlaysToFront: () => {
        for (let i = 0; i < cards.overlays.children.length; i++) {
            cards.overlays.children[i].style.zIndex = '8';
        }
    },

    slideToExtremePosition: (directionName) => {
        let swipe = cards.swipes[directionName];

        cards.transformUi(1, swipe.extremePosX, swipe.extremePosY, 0, true, cards.firstCard);
        cards.transformUi(1, swipe.extremePosX, swipe.extremePosY, 0, true, swipe.overlay);

        if (swipe.isMoveOn) {
            cards.changeBackground();
            cards.resetCards(1);
        }
    },

    changeBackground: (number) => {
        let currentColorNumber = -1;
        document.body.classList.forEach(function(value) {
            if (value.startsWith('background-')) {
                currentColorNumber = Number(value.split('-')[1]);
                document.body.classList.remove(value);
            }
        });
        number = number || (currentColorNumber <= 6) ?
            currentColorNumber + 1 :
            0;
        document.body.classList.add('background-' + number);
    },

    resetCards: (skip) => {
        skip = skip || 0;
        const cardsCount = cards.stackedCards.childElementCount;
        for (let i = cardsCount - 1; i >= skip; i--) {
            let card = cards.stackedCards.children[i];
            const n = i - skip;
            const elTrans = (cards.elementsMargin * n) * -1;
            const elScale = 1 - (cards.scaleMultiplier * n);
            const elOpacity = 1 - ((1 / cardsCount) * n);
            const zIndex = 7 - i;
            card.style.zIndex = zIndex.toString();
            const noTransition = skip === 0 && (cardsCount === 1 || i !== cardsCount - 1);
            if (!noTransition) {
                setTimeout(() => cards.transformUi(elScale, 0, elTrans, elOpacity, false, card, noTransition), 1);
            } else {
                cards.transformUi(elScale, 0, elTrans, elOpacity, false, card, noTransition);
            }
        }
    },

    //Add translate X and Y to active card for each frame.
    transformUi: (scale, moveX, moveY, opacity, doRotate, element, noTransition) => {
        const transition = !noTransition || false;
        if (transition) {
            element.classList.remove('no-transition');
        } else {
            element.classList.add('no-transition');
        }
        requestAnimationFrame(function() {
            // Function to generate rotate value 
            /**
             * @return {number}
             */
            function RotateRegulator(value) {
                if (value / 10 > 15) {
                    return 15;
                } else if (value / 10 < -15) {
                    return -15;
                }
                return value / 10;
            }

            const rotateElement = doRotate ? RotateRegulator(moveX) : 0;
            element.style.transform = 'scale(' + scale + ') translateX(' +
                moveX + 'px) translateY(' + moveY +
                'px) translateZ(0px) rotate(' + rotateElement + 'deg)';
            element.style.opacity = opacity;
        });
    },
};