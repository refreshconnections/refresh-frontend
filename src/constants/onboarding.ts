const SHARED_LOCATION_COORDS_COPY = {
  useLocation: 'Share by device location',
  chooseCity: 'Share by choosing my city',
  coordsSaved: 'You can edit how your location appears on your Profile in the next step.',
  dontShare: "Don't share my location",
  confirmPrefix: "So just confirming, you're near ",
  confirmSuffix: '?',
  confirmCancel: "No",
  confirmConfirm: 'Yes',
  deniedHeader: "Refresh Connections can't access your location because of your settings.",
  deniedSubHeader: 'Allow the app to see your current location by going to Settings > Refresh > Location.',
  gpsErrorHeader: "We couldn't get your location coordinates.",
  gpsErrorMessage: 'Try again, choose your city, or continue without sharing.',
  declineCancel: 'Go back',
  declineConfirm: 'OK',
};

export const ONBOARDING_COPY = {
  common: {
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    finishLater: 'Finish later',
    returnToLogin: 'Return to login',
  },
  onboardingV2: {
    welcome: {
      title: 'Welcome to Refresh Connections',
      body:
        "We are a Covid Conscientious community for friendships, support, and one-on-one connections.",
      primaryCta: 'Get Started',
    },
    info: {
      title: 'What to expect',
      sections: [
        {
          title: 'Community connections',
          body:
            "Start by creating your Refreshments Profile, which lets you take part in the community side of the app. This is where members gather for shared conversation, support, and discussion in the Refreshments Bar and Calendar.",
        },
        {
          title: 'Personal connections',
          body:
            "When you are ready, you can create your Personal Profile to discover one-on-one connections for friendship, support, or dating. This is where you’ll share how you approach Covid and what kinds of connections you’re looking for. Connections and messaging on the personal side always require mutual consent."},
        {
          title: 'Getting started',
          body:
            "On the next two screens, we’ll ask for your mobile number and birthdate to help keep your account secure and support community safety. After that, you can look around and create the profiles you want to use.",
        },
      ],
      continueCta: "Continue",
    },
    phone: {
      title: 'Verify your mobile number',
      body: "We'll text you a short code to confirm this number is yours.",
      placeholder: 'Enter mobile number',
      whyShow: 'Why do you need my phone number?',
      whyHide: 'Hide why we ask',
      whyBody:
        "We use your mobile number to help secure your account and support community safety by preventing duplicate accounts. Your number is not shown to other members, and how we handle it is explained in our Privacy Policy. Temporary or anonymous numbers can’t be used.",
      existingPhoneCta: 'Next',
      sendCodeCta: 'Send code',
      invalidError: 'Enter a valid phone number.',
      codeAlert: {
        header: 'Enter the 6-digit code we texted you',
        placeholder: 'Code',
        cancel: 'Cancel',
        verify: 'Verify',
      },
      verificationFailed: {
        header: 'Verification failed',
        fallback: 'Please try again',
      },
      inUse: {
        header: 'Phone number in use',
        message:
          'This phone number is already associated with another account. Return to the login page and choose "Forgot email / password" to find another account, or contact help@refreshconnections.com if you deleted a previous account in error.',
      },
      tooManyAttempts: {
        header: 'Too many attempts',
        message: 'Please wait a bit before trying again.',
      },
      unableToSend: {
        header: 'Unable to send code',
        fallback: 'Please try again later.',
      },
    },
    birthday: {
      title: 'When is your birthday?',
      body:
        "We use your birthdate to verify that you're eligible to use Refresh Connections, support community safety, and for features like age-based filters.", // TODO
      emptyLabel: 'Choose your birthday',
      whyShow: 'Why do you need my birthday?',
      whyHide: 'Hide why we ask',
      whyBody:
        "Your birthdate is used to confirm eligibility and support age-based filters. To help prevent misuse of age-based features, you won't be able to edit your birthdate yourself later. Your full birthdate is not shown to other members, and how we handle it is explained in our Privacy Policy.",
      saveCta: 'Save birthday',
      confirm: {
        suffix: ' will show as your age. Is this correct?',
        cancel: 'No, go back',
        confirm: 'Yes',
      },
    },
    underAge: {
      title: 'Thanks for your interest',
      body:
        "Refresh Connections is only available to members who are 18 or older. Since you're under 18, we can't create an account for you right now. We'll be here when you're ready.",
      contactPrefix: 'If you feel a mistake has been made, please contact ',
      contactEmail: 'ageverification@refreshconnections.com',
      logoutCta: 'Log out',
    },
    ready: {
      title: "You're ready to get started!",
      community: {
        title: 'Set up your Refreshments Profile',
        body: 'Join in the discussion and find Covid Conscientious events at the Refreshments Bar and Calendar.',
        cta: 'Create your Refreshments Profile',
      },
      personal: {
        title: 'Set up your Personal Profile',
        body:
          "Discover one-on-one connections and message them when you're ready.",
        cta: 'Create your Personal Profile',
      },
      explore: {
        title: 'Check things out first',
        body:
          "Want to look around first? Feel free to explore the community side of the app, then create the profiles you want to use when you're ready.",
        cta: 'Explore the app',
      },
    },
  },
  communityOnboarding: {
    welcome: {
      title: 'Welcome to your Refreshments Profile',
      withPersonalProfile:
        'Your Refreshments Profile is how you appear in the Refreshments Bar and Calendar. It includes your Refreshments handle, a photo, and any other details you want to share with the community.',
      withPersonalProfileSecondary: 
        'Continue conversations one-on-one with people you meet in the Refreshments Bar and Calendar by turning on “Connect from Refreshments.”',
      withoutPersonalProfileSecondary:
        'Later, you can continue conversations one-on-one with people you come across in the Refreshments Bar and Calendar by creating your Personal Profile and turning on "Connect from Refreshments."',
    },
    username: {
      title: 'Choose your Refreshments handle',
      body: `This is the name that will appear next to your posts and comments in the Refreshments Bar and Calendar. It can be different from your Personal Profile name, so you can choose what name to use in each space.

        You can update your Refreshments handle every 60 days.
        `,
      placeholderFallback: 'Choose your handle',
      lockedNote: "You can't change your handle yet.",
      requiredToContinue: 'Please choose a Refreshments handle to continue.',
      taken: 'That username is already taken. Try another.',
      requiredToFinish: 'Please choose a Refreshments handle to finish.',
    },
    connect: {
      title: 'Find connection in the community',
      body: 
        `See someone at the Refreshments Bar or in the Refreshments Calendar you'd like to know better? 
        Turn on Connect from Refreshments to view profiles and send Likes from the community side of Refresh Connections. If the Like is mutual, you can start a one-on-one conversation.`,
      toggleLabel: 'Enable Connect from Refreshments',
    },
    photo: {
      title: 'Choose your Refreshments Profile photo',
      withPersonalPhoto: 'This is the photo people see when they view your Refreshments Profile from the Refreshments Bar and Calendar. Use your Personal Profile photo or pick a new one just for the Refreshments community.',
      withoutPersonalPhoto: 'This is the photo people see when they view your Refreshments Profile from the Refreshments Bar and Calendar.',
      toggleLabel: 'Use Personal Profile photo',
      missingPersonalPhoto: 'Add a Personal Profile photo first to use it here.',
      uploadCta: 'Upload a Refreshments Profile photo',
    },
    bio: {
      title: 'Your Refreshments bio',
      body:
        'This is a brief description people see when they open your Refreshments Profile from your posts or comments in the Refreshments Bar and Calendar.',
    },
    location: {
      title: 'Show your location?',
      withSharedCoords:
        'Choose whether to show your location on your Refreshments Profile.It can be vaguer than the location you shared for filtering and local features, and you can update it any time.',
      withoutSharedCoords:
        "Even though you didn't share your location with the app to see local posts, you can add a general location label to show on your Refreshments Profile if you'd like.",
      shownPrefix: 'Location shown on your Profile: ',
      addLocation: 'Add location',
      editLocation: 'Edit location',
      toggleLabel: 'Show location',
    },
    age: {
      title: 'Show your age?',
      body: 'Choose how your age appears on your Refreshments Profile.',
      shownPrefix: 'Age shown on your Refreshments Profile: ',
      hideAge: "(hidden)",
      showExact: 'Show exact age',
      showDecade: 'Show decade only',
      hide: 'Hide age',
    },
    ready: {
      title: 'Done!',
      body: 'Your Refreshments Profile is ready. You can update these choices later in your Me tab > Profile. You can go ahead and set up your Personal Profile now too, or explore Refreshments first!',
      createPersonal: 'Create your Personal Profile',
      finish: 'Go to the Refreshments Bar',
    },
  },
  personalProfile: {
    intro: {
      title: 'Create your Personal Profile',
      bodyPrimary:
        "Your Personal Profile lets you discover other members, receive Likes, and connect one-on-one.",
      cta: "Let's go",
    },
    logoutConfirm: {
      header: 'Are you sure you want to return to login?',
      subHeader: 'You will be logged out.',
      cancel: 'Nevermind',
      confirm: 'Yes',
    },
  },
  cards: {
    name: {
      title: "What's your name?",
      bodyPrimary:
        'This is the name (first name or nickname) shown on your Personal Profile.',
      bodySecondary: 'It’s separate from your Refreshments handle on the community side of the app. To help keep Personal Profiles genuine and interactions clear, name changes are handled by support.',
    },
    pronouns: {
      title: 'What are your pronouns?',
      body: 'Select your pronouns or add your own. You can always update this later in your profile.',
      label: 'Pronouns',
      placeholder: 'Select',
      customLabel: 'Custom pronouns',
      customPlaceholder: 'e.g. ze/zir',
      options: [
        { label: 'She / Her', value: 'She/Her' },
        { label: 'He / Him', value: 'He/Him' },
        { label: 'They / Them', value: 'They/Them' },
        { label: 'Prefer not to say', value: 'Prefer not to say' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    locationCoords: {
      personal: {
        title: 'Discover people near you',
        body: `Share your location to power distance filters on the personal side of Refresh Connections and to see local posts and events at the Refreshment Bar and Calendar.

            Adding your location now helps you get more out of Refresh Connections from the start, but it's always optional.`,
        declineHeader: 'Skip for now?',
        declineMessage:
          "You can still use Refresh Connections, but filtering to discover people near you won't work until you add your location.",
        ...SHARED_LOCATION_COORDS_COPY,
      },
      community: {
        title: 'See posts and events near you',
        body: `Share your location to see posts and events local to you in the Refreshments Bar and Calendar.

        You can also use your location for distance filtering on the personal side if you create a Personal Profile later.

        Adding your location now helps you get more out of Refresh Connections from the start, but it's always optional.`,
        bodyWithPersonalProfile: `Share your location to see posts and events local to you in the Refreshments Bar and Calendar.

        It will also power distance filtering on your personal profile.

        Adding your location now helps you get more out of Refresh Connections from the start, but it's always optional.`,
        declineHeader: 'Skip for now?',
        declineMessage:
          "You can still use the community side of Refresh Connections, but you won't be able to see local posts and events until you add your location.",
        ...SHARED_LOCATION_COORDS_COPY,
      },
    },
    locationLabel: {
      title: 'Choose your location label',
      withCoords:
        'This is the general location label that appears on your Profiles. It can be vaguer than the location you shared for filtering and local features, and you can update it any time.',
      withoutCoords:
        "Even if you don't share your specific location for filtering, you can still add a more general location label for other members to see.",
      profileNote:
        'This general location is shown on your Personal Profile, and it\'s your choice to show it on your Refreshments Profile too.',
      label: 'Location label',
      placeholder: 'Your city and country',
      note:
        "Since we're an international app, it's helpful to share your country here. Never share your exact address.",
    },
    lookingFor: {
      title: 'What kind of connections are you looking to make?',
      body: 'These will be shown on your profile. You can change these at any time.',
      scrollNote: 'Scroll for all options!',
      options: [
        { value: 'friendship', label: 'Friendships' },
        { value: 'romance', label: 'Romance' },
        { value: 'virtual connection', label: 'Virtual Connection' },
        { value: 'job', label: 'Job' },
        { value: 'housing', label: 'Housing / roommate' },
        { value: 'families', label: 'Families' },
      ],
    },
    genderIdentity: {
      title: 'How do you identify?',
      body:
        'These choices can help other members discover your profile. You can choose to show them on your profile, or keep them just for filtering.',
      scrollNote: 'Scroll for all options!',
      subtext:
        '',
      showOnProfile: 'Show on Profile',
      options: [
        ['woman', 'Woman'],
        ['man', 'Man'],
        ['nb', 'Nonbinary/gender noncomforming'],
        ['genderfluid', 'Gender Fluid'],
        ['cis', 'Cis'],
        ['trans', 'Trans'],
        ['intersex', 'Intersex'],
        ['straight', 'Straight/heterosexual'],
        ['gay', 'Gay/homosexual'],
        ['lesbian', 'Lesbian'],
        ['bi', 'Bi'],
        ['pan', 'Pan'],
        ['gray ace', 'Gray ace'],
        ['ace', 'Ace'],
        ['demi', 'Demisexual'],
        ['queer', 'Queer'],
        ['mono', 'Monogamous'],
        ['poly', 'Nonmonogamous'],
      ] as [string, string][],
    },
    livedExperiences: {
      title: 'Lived experiences*',
      body: 'These choices can help other members discover your Personal Profile. You can choose to show them on your Profile, or keep them just for filtering.',
      popover:
        "*We're adding future filters. These filters will unlock once enough members opt in.",
      scrollNote: '',
      subtext: 'You can choose to show these on your Personal Profile, or keep them just for filtering.',
      showOnProfile: 'Show on Profile',
      options: [
        ['poc', 'POC'],
        ['neurodivergent', 'Neurodivergent'],
        ['sober', 'Sober'],
      ] as [string, string][],
    },
    covid: {
      title: 'How are you dealing with Covid?',
      body: 'These choices will be shown on your profile. You can change these at any time.',
      noteLabel: 'Anything else you want to share?',
      notePlaceholder: 'Optional',
      scrollNote: 'Scroll for all options!',
      sections: {
        home: 'Home:',
        work: 'Work:',
        play: 'Play:',
        other: 'Other:',
      },
      options: [
        { value: 18, label: 'I have no routine daily exposures' },
        { value: 3, label: 'I live with non-Covid cautious people' },
        { value: 8, label: 'I live alone/with others that share my level of Covid caution' },
        { value: 1, label: 'I work from home' },
        { value: 9, label: 'I go to work/school but always in a high quality mask' },
        { value: 16, label: 'My work requires poor/no masking' },
        { value: 2, label: 'I eat outside at restaurants with good airflow and spacing' },
        { value: 15, label: 'I do takeout from restaurants' },
        { value: 5, label: 'I attend outdoor events' },
        { value: 12, label: 'I attend outdoor events with a mask on' },
        { value: 6, label: 'I attend indoor events with a mask on' },
        { value: 4, label: "I'm immunocompromised/have a high-risk health condition" },
        { value: 17, label: 'I am a caregiver' },
        { value: 7, label: 'I only leave home/outdoors for medically necessary reasons' },
        { value: 10, label: 'I am living with Long Covid' },
        { value: 11, label: 'I use air purifiers and use HEPA filters' },
        { value: 13, label: 'I ask for testing before all meetups' },
        { value: 14, label: 'I ask for testing before indoor meetups' },
      ],
    },
    profilePic: {
      title: 'Upload a Personal Profile photo!',
      body:
        `Front and center on your Personal Profile, your photo helps other members get to know the real you.

        A clear face photo is required for all Personal Profiles on Refresh Connections. We recommend choosing a photo of just you for your first picture.`,
      upload: 'Upload',
      skip: "Don't feel like adding pictures yet?",
    },
    pictures: {
      title: 'Now add a couple more pictures!',
      body: 'You can add a bunch more later. Add two, and a caption for each, now!',
      upload: 'Upload',
      skip: "Don't feel like adding pictures yet?",
    },
    bio: {
      title: "You're just about done!",
      body:
        `Anything else you want to tell people?

        This is your bio, a space to share more about yourself in your own words. It will appear prominently on your Personal Profile, and you can update it at any time.`,
    },
    letsTalkAbout: {
      title: "Let's talk about...",
      body: "Choose three topics to add to your profile. They make for easy conversation starters.",
      chooseTopics: 'Choose three topics',
      pickThree: 'Pick three',
      options: [
        { value: 'together_idea', label: 'Something we could do together' },
        { value: 'hobby', label: 'Hobbies' },
        { value: 'petpeeve', label: 'Pet peeves' },
        { value: 'talent', label: 'Talents' },
        { value: 'fave_book', label: 'Favorite book' },
        { value: 'fave_tv', label: 'Favorite TV show' },
        { value: 'fave_movie', label: 'Favorite movie' },
        { value: 'fave_album', label: 'Favorite album' },
        { value: 'fave_musicalartist', label: 'Favorite musical artist' },
        { value: 'fave_game', label: 'Favorite game' },
        { value: 'fave_topic', label: 'Favorite topic' },
      ],
    },
    done: {
      title: "That's it!",
      body: 'Head to the "Me" tab at any time to update or add to your Profiles!',
      connectTitle: 'Connect from Refreshments',
      connectBody:
        'Use Connect from Refreshments to invite a member you see at the Refreshments Bar post or Calendar to join you in a one-on-one conversation.',
      refreshCta: "Let's Refresh!",
      pausedReview: {
        subHeader:
          "As part of our effort to keep Refresh safe and conscientious, we're reviewing your account before you can connect with others. We appreciate your patience.",
        message:
          'In the meantime, you can continue to add to your profile by going to the Me tab > Profile.',
        confirm: 'Ok',
      },
    },
  },
} as const;
