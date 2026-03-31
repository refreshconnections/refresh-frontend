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
        "We're a Covid conscientious community for building friendships, support, and (if you choose) one-on-one connections.",
      primaryCta: "I'm ready to get started",
      secondaryCta: 'I want to know more first',
    },
    info: {
      title: 'What to expect',
      sections: [
        {
          title: 'Community connections',
          body:
            "You'll start on the community side of the app--a shared space where members can gather, listen, and join in when they're ready. Here you can join conversations, community check-ins at the Refreshments Bar, and other spaces to share wins, resources, and gatherings that match your comfort level.",
        },
        {
          title: 'Personal connections',
          body:
            "Refresh Connections also has a personal side, where you can discover intentional one-on-one connections. Create a profile that reflects how you approach Covid and what you're looking for, then explore potential matches for friendship, support, or dating. Messaging always requires mutual consent.",
        },
        {
          title: 'Getting started',
          body:
            "On the next two screens we'll ask for your mobile number and birthdate. They help keep your account and the community safer. After that, you can start exploring the community—and, if you'd like, fill out a profile so you can join the discovery on the one-on-one connections side of the app.",
        },
      ],
      continueCta: "Sounds good, let's verify",
    },
    phone: {
      title: 'Verify your mobile number',
      body: "We'll send a short code by SMS to confirm this number is yours.",
      placeholder: 'Enter phone number',
      whyShow: 'Why do you need my phone number?',
      whyHide: 'Hide why we ask',
      whyBody:
        "We use your mobile number to help secure your account, support community safety by preventing duplicate accounts, and as a second check when you make important account changes. Your number is never shown to other members or used for marketing texts, and how we handle it is explained in our Privacy Policy. Temporary or anonymous numbers can't be used.",
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
          'This phone number is already associated with another account. Return to the login page and choose "Forgot email / password" to search for another account, or contact help@refreshconnections.com if you deleted a previous account in error.',
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
        "We use your birthdate to verify that you're eligible to use Refresh Connections and to support community safety features like age-based filters.",
      emptyLabel: 'Choose your birthday',
      whyShow: 'Why do you need my birthday?',
      whyHide: 'Hide why we ask',
      whyBody:
        "Used for account verification, community safety, and making sure age filters work the way members expect. You won't be able to edit your birthdate yourself later. Your full birthdate isn't shown to other members, and how we handle it is explained in our Privacy Policy.",
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
        title: 'Set up a community profile',
        body: 'Join in on conversations at the Refreshments Bar and other shared spaces.',
        cta: 'Start community profile',
      },
      personal: {
        title: 'Set up a personal profile',
        body:
          "Send Likes and exchange one-on-one messages when you're ready for personal connections.",
        cta: 'Start personal profile',
      },
      explore: {
        title: 'Check things out first',
        body:
          'Take a look around first. You can always add a community and personal profile later.',
        cta: 'Explore the app',
      },
    },
  },
  communityOnboarding: {
    welcome: {
      title: 'Welcome to your community profile',
      withPersonalProfile:
        'This creates your community identity—your username for posts and comments, plus a photo and any extra details you want to share. Anyone can see this.',
      withPersonalProfileSecondary:
        'Since you already have a personal profile, you can also connect 1:1 by turning on Connect from Refreshments.',
      withoutPersonalProfileSecondary:
        'Later, if you create a personal profile, you can connect 1:1 by turning on Connect from Refreshments.',
    },
    username: {
      title: 'Pick your community username',
      body: 'Your username appears next to your posts and comments. You can only change it every {days} days.',
      placeholderFallback: 'yourname',
      lockedNote: "You can't change your username yet.",
      requiredToContinue: 'Please choose a username to continue.',
      taken: 'That username is already taken. Try another.',
      requiredToFinish: 'Please choose a username to finish.',
    },
    connect: {
      title: 'Connect from Refreshments',
      body:
        'Turn this on to let people discover your personal profile from your community posts and comments.',
      toggleLabel: 'Connect from Refreshments',
    },
    photo: {
      title: 'Choose your community photo',
      withPersonalPhoto: 'Use your personal profile photo or upload a community-only photo.',
      withoutPersonalPhoto: 'Upload a community-only photo to represent you in the community.',
      toggleLabel: 'Use personal profile photo',
      missingPersonalPhoto: 'Add a personal profile photo first to use it here.',
      uploadCta: 'Upload a community photo',
      existingPhotoNote: 'Your current community photo will stay unless you upload a new one.',
    },
    bio: {
      title: 'Write a community bio',
      body:
        'Keep it short—this is what people will see when they click your name on comments and posts.',
    },
    location: {
      title: 'Show your location?',
      body: 'Share your general location on your community profile.',
      shownPrefix: 'Location shown on your profile: ',
      addLocation: 'Add location',
      editLocation: 'Edit location',
      toggleLabel: 'Show location',
    },
    age: {
      title: 'Show your age?',
      body: 'Choose how your age appears on your community profile.',
      shownPrefix: 'Age shown on your profile: ',
      hideAge: "Don't show age",
      showExact: 'Show exact age',
      showDecade: 'Show decade only',
      hide: 'Hide age',
    },
    ready: {
      title: 'Community profile ready!',
      body: 'You can update any of these choices later in Settings.',
      finish: 'Finish',
    },
  },
  personalProfile: {
    intro: {
      title: 'Create your personal profile',
      bodyPrimary:
        'Create your personal profile so other members can get to know you one-on-one.',
      bodySecondary:
        "You'll need a personal profile to send likes and private messages.",
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
        'This is the name (a first name or a nickname) that will be shown on your profile.',
      bodySecondary: 'We require you to contact support if you need to change your name later.',
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
      title: 'Where do you live?',
      body:
        'Refresh uses your coordinates to show nearby matches. Your profile shows a location label, and you control how specific it is.',
      useLocation: 'Use my location',
      chooseCity: 'Choose my city',
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
      declineHeader: "Distance filters won't work without coordinates",
      declineMessage: "You can still use Refresh, but you won't be able to filter your picks by distance.",
      declineCancel: 'Go back',
      declineConfirm: 'OK',
    },
    locationLabel: {
      title: 'Location shown on your profile',
      withCoords:
        "We'll use your location to show nearby matches. This is the location label other members will see.",
      withoutCoords:
        'You chose not to share your location with the app, but you can still add a location label to your profile for other members to see.',
      label: 'Location label',
      placeholder: 'City, region, or neighborhood',
      note:
        'You can keep this broad (like a state or country even) or more specific (like your city) - but never share your exact address!',
    },
    lookingFor: {
      title: 'What kind of connections are you looking to make?',
      body: 'These will be shown on your profile. You can change these at any time.',
      scrollNote: 'Scroll for all options!',
      options: [
        { value: 'friendship', label: 'Friendships' },
        { value: 'romance', label: 'Romance' },
        { value: 'virtual connection', label: 'Virtual Connection' },
        { value: 'virtual only', label: 'Virtual Connection Only' },
        { value: 'job', label: 'Job' },
        { value: 'housing', label: 'Housing / roommate' },
        { value: 'families', label: 'Families' },
      ],
    },
    genderIdentity: {
      title: 'How do you identify?',
      body:
        'We use your gender identity to share your profile with potential connections. Choose as many as apply to you.',
      scrollNote: 'Scroll for all options!',
      subtext:
        'These choices are used to filter your picks. You can choose to show them on your profile, or keep them just for filtering.',
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
      body: 'Choose any that apply. These are used for filtering in picks.',
      popover:
        "We're adding future filters. Filtering will unlock once enough members opt in to ensure meaningful results.",
      scrollNote: 'Scroll for all options!',
      subtext: 'You can choose to show these on your profile, or keep them just for filtering.',
      showOnProfile: 'Show on profile',
      options: [
        ['poc', 'POC'],
        ['spiritual', 'Spiritual'],
        ['neurodivergent', 'Neurodivergent'],
        ['sober', 'Sober'],
      ] as [string, string][],
    },
    covid: {
      title: 'How are you dealing with Covid?',
      body: 'These will be shown on your profile. You can change these at any time.',
      noteLabel: 'Anything else you want to share?',
      notePlaceholder: 'Optional note about your Covid precautions',
      scrollNote: 'Scroll for all options!',
      sections: {
        home: 'Home:',
        work: 'Work:',
        play: 'Play:',
        other: 'Other:',
      },
      options: [
        { value: 18, label: 'I have no routine daily exposures' },
        { value: 3, label: 'I live with non-covid cautious people' },
        { value: 8, label: 'I live alone/with others that share my level of covid caution' },
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
      title: 'Upload a profile picture!',
      body:
        'Make a good first impression. This is the first thing that will show on your profile. We recommend it be of just you. Remember, your profile needs to include at least one photo that shows your face.',
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
        'Anything else you want to tell people? Fill out the bio section! This is free space for you to say whatever you want about yourself (you know, within reason). Update this at any time. It will be shown front and center on your profile!',
    },
    letsTalkAbout: {
      title: "Let's talk about",
      body: 'Choose three prompts and fill them out so people have easy conversation starters.',
      chooseTopics: 'Choose three topics',
      pickThree: 'Pick three',
      options: [
        { value: 'together_idea', label: 'Something we could do together' },
        { value: 'hobby', label: 'Hobbies' },
        { value: 'petpeeve', label: 'Pet peeves' },
        { value: 'talent', label: 'Talents' },
        { value: 'fixation_book', label: 'Favorite book' },
        { value: 'fixation_tv', label: 'Favorite TV show' },
        { value: 'fixation_movie', label: 'Favorite movie' },
        { value: 'fixation_album', label: 'Favorite album' },
        { value: 'fixation_musicalartist', label: 'Favorite musical artist' },
        { value: 'fixation_game', label: 'Favorite game' },
        { value: 'fixation_topic', label: 'Favorite interest/topic' },
      ],
    },
    done: {
      title: "That's it!",
      body: 'Head to the "Me" tab at any time to update or add to your profile!',
      connectTitle: 'Connect from Refreshments',
      connectBody:
        'Turn this on to let people discover your personal profile from your community posts and comments.',
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
