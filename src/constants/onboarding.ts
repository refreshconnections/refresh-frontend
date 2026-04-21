const SHARED_LOCATION_COORDS_COPY = {
  useLocation: 'Share by device location',
  chooseCity: 'Share by choosing my city',
  coordsSaved: 'Coordinates saved. You can edit your location label on the next step.',
  dontShare: "Don't share my location",
  confirmPrefix: "So just confirming, you're near ",
  confirmSuffix: '?',
  confirmCancel: "Nope, I'll try again.",
  confirmConfirm: 'Yep',
  deniedHeader: "Location access isn't enabled.",
  deniedMessage: 'You can enable location access, choose your city, or continue without sharing.',
  gpsErrorHeader: "We couldn't get your GPS coordinates.",
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
      primaryCta: "I'm ready to get started",
      secondaryCta: 'Tell me more first',
    },
    info: {
      title: 'What to expect',
      sections: [
        {
          title: 'Community connections',
          body:
            "You can start by creating your Refreshments profile, which lets you take part in the community side of the app. This is where members gather for shared conversation, support, and discussion in the Refreshments Bar and Calendar.",
        },
        {
          title: 'Personal connections',
          body:
            "On the personal side of the app, you can discover one-on-one connections for friendship, support, or dating. To do that, you'll create a more detailed personal profile that reflects how you approach Covid and what kinds of connections you're looking for. Messaging always requires mutual consent.",
        },
        {
          title: 'Getting started',
          body:
            "On the next two screens, we'll ask for your mobile number and birthdate. These help keep your account secure and support community safety. After that, you can look around and, when you’re ready, create the profiles you want to use.",
        },
      ],
      continueCta: "Let's verify",
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
        title: 'Set up a Refreshments profile',
        body: 'Join in the discussion and find Covid Conscientious events at the Refreshments Bar and Calendar.',
        cta: 'Start Refreshments profile',
      },
      personal: {
        title: 'Set up a personal profile',
        body:
          "Discover one-on-one connections and message them when you're ready.",
        cta: 'Start personal profile',
      },
      explore: {
        title: 'Check things out first',
        body:
          "Want to look around before creating a profile? Explore the community side first, then create the profiles you want to use when you're ready.",
        cta: 'Explore the app',
      },
    },
  },
  communityOnboarding: {
    welcome: {
      title: 'Welcome to your Refreshments profile',
      withPersonalProfile:
        'Your Refreshments profile is how you appear in the Refreshments Bar and Calendar. It includes your Refreshments handle, a photo, and any other details you want to share with the community.',
      withPersonalProfileSecondary: 
        'Continue conversations one-on-one with people you meet in the Refreshments Bar by turning on “Connect from Refreshments.”',
      withoutPersonalProfileSecondary:
        'Later, you can continue conversations one-on-one with people you meet in the Refreshments Bar by creating a personal profile and turning on “Connect from Refreshments.”',
    },
    username: {
      title: 'Choose your Refreshments handle',
      body: `This is the name that will appear next to your posts and comments in the Refreshments Bar and Calendar. It can be different from your personal profile name.

        You can change your handle every 60 days.
        `,
      placeholderFallback: 'yourhandle',
      lockedNote: "You can't change your handle yet.",
      requiredToContinue: 'Please choose a username to continue.',
      taken: 'That username is already taken. Try another.',
      requiredToFinish: 'Please choose a username to finish.',
    },
    connect: {
      title: 'Find connection in the community',
      body: 
        `See someone at the Refreshments Bar or in the Refreshments Calendar you'd like to know better? 
        Turn on Connect from Refreshments to view profiles and send Likes from the community side of Refresh Connections. If the Like is mutual, you can start a one-on-one conversation.`,
      toggleLabel: 'Enable Connect from Refreshments',
    },
    photo: {
      title: 'Choose your Refreshments profile photo',
      withPersonalPhoto: 'This is the photo people see when they view your Refreshments profile from the Refreshments Bar and Calendar. Use your personal profile photo or pick a new one just for the Refreshments community.',
      withoutPersonalPhoto: 'This is the photo people see when they view your Refreshments profile from the Refreshments Bar and Calendar.',
      toggleLabel: 'Use personal profile photo',
      missingPersonalPhoto: 'Add a personal profile photo first to use it here.',
      uploadCta: 'Upload a Refreshments profile photo',
    },
    bio: {
      title: 'Your Refreshments bio',
      body:
        'This is a brief description people see when they open your Refreshments profile from your posts or comments in the Refreshments Bar and Calendar.',
    },
    location: {
      title: 'Show your location?',
      withSharedCoords:
        'Choose whether the location that shows on your personal profile is also shown on your Refreshments profile.',
      withoutSharedCoords:
        "Even though you didn't share your location with the app to see local posts, you can add a general location label to show on your Refreshments profile if you'd like.",
      shownPrefix: 'Location shown on your profile: ',
      addLocation: 'Add location',
      editLocation: 'Edit location',
      toggleLabel: 'Show location',
    },
    age: {
      title: 'Show your age?',
      body: 'Choose how your age appears on your Refreshments profile.',
      shownPrefix: 'Age shown on your Refreshments profile: ',
      hideAge: "(hidden)",
      showExact: 'Show exact age',
      showDecade: 'Show decade only',
      hide: 'Hide age',
    },
    ready: {
      title: 'Done!',
      body: 'Your Refreshments profile is ready. You can update these choices later in your Me tab > Profile. You can go ahead and set up your personal profile now too, or explore Refreshments first!',
      createPersonal: 'Create your personal profile',
      finish: 'Go to the Refreshments Bar',
    },
  },
  personalProfile: {
    intro: {
      title: 'Create your personal profile',
      bodyPrimary:
        "Your personal profile lets you discover other members, receive Likes, and connect one-on-one.",
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
        'This is the name (a first name or a nickname) that will be shown on your personal profile.',
      bodySecondary: 'It is separate from your Refreshments handle on the community side of the app. If you ever need to change it later, contact support so we can help keep profiles genuine and interactions clear.',
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
        title: 'Turn on Distance Filters',
        body: `Share your location to power distance filters on the personal side of Refresh Connections and to see local Refreshments Bar posts and Refreshments Calendar events.

            Add your location now to get the most out of Refresh Connections from the start, but this step is optional.`,
        declineHeader: 'Skip Distance Filters for now?',
        declineMessage:
          "You can still use Refresh Connections, but personal-side discovery by location won't work until you add your location.",
        ...SHARED_LOCATION_COORDS_COPY,
      },
      community: {
        title: 'See local posts and events',
        body: `Share your location with the app to see posts and events local to you in the Refreshments Bar and Calendar.

        You can also use your location to power distance filtering on the personal side of Refresh Connections if you create a personal profile later.

            Add your location now to get the most out of Refresh Connections from the start, but this step is optional.`,
        declineHeader: 'Skip location for now?',
        declineMessage:
          "You can still use the community side of Refresh Connections, but you won't be able to see local posts and events until you add your location.",
        ...SHARED_LOCATION_COORDS_COPY,
      },
    },
    locationLabel: {
      title: 'Choose your location label',
      withCoords:
        'This is the general location label that appears on your profiles. It can be vaguer than the location you shared for filtering and local features, and you can update it any time.',
      withoutCoords:
        "Even if you don't share your location for filtering, you can still add a general location label for other members to see.",
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
      showOnProfile: 'Show on profile',
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
        ['poly', 'Polyamorous'],
      ] as [string, string][],
    },
    livedExperiences: {
      title: 'Lived experiences',
      body: 'These choices can help other members discover your profile. You can choose to show them on your profile, or keep them just for filtering.',
      popover:
        "We're adding future filters. These filters will unlock once enough members opt in.",
      scrollNote: '',
      subtext: 'You can choose to show these on your profile, or keep them just for filtering.',
      showOnProfile: 'Show on profile',
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
      title: 'Upload a profile photo!',
      body:
        `Front and center on your profile, your photo helps other members get to know the real you.

        A clear face photo is required for all personal profiles on Refresh Connections. We recommend choosing a photo of just you for your first picture.`,
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

        This is your bio, a space to share more about yourself in your own words. It will appear prominently on your profile, and you can update it at any time.`,
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
      body: 'Head to the "Me" tab at any time to update or add to your profile!',
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
