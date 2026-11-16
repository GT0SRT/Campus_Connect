const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seeding for CampusConnect...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Upsert Main User
  const mainUser = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: {
      fullName: 'Subham Sharma',
      username: 'subham_s',
      about: 'Final year CSE builder passionate about AI systems, web architecture, and campus collaboration.',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Computer Science & Engineering',
      skills: ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Machine Learning', 'Docker'],
      interests: ['AI/ML', 'Web Development', 'Hackathons', 'Open Source', 'System Design'],
      tags: ['Student', 'Developer', 'Open Source'],
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 95,
      education: [
        {
          id: 'edu-main-1',
          collegeName: 'UIT-RGPV, Bhopal',
          branch: 'Computer Science and Engineering',
          fromYear: 2023,
          toYear: 2027,
        },
      ],
      experience: [
        {
          id: 'exp-main-1',
          company: 'Campus Connect',
          role: 'Full Stack & AI Lead',
          year: 2026,
        },
      ],
      projects: [
        {
          id: 'proj-main-1',
          title: 'Campus Connect Platform',
          description: 'A unified campus social ecosystem with graph matchmaking and realtime squads.',
          link: 'https://github.com/example/campus-connect',
        },
      ],
    },
    create: {
      email: 'user@gmail.com',
      username: 'subham_s',
      password: passwordHash,
      fullName: 'Subham Sharma',
      about: 'Final year CSE builder passionate about AI systems, web architecture, and campus collaboration.',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Computer Science & Engineering',
      skills: ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Machine Learning', 'Docker'],
      interests: ['AI/ML', 'Web Development', 'Hackathons', 'Open Source', 'System Design'],
      tags: ['Student', 'Developer', 'Open Source'],
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 95,
      education: [
        {
          id: 'edu-main-1',
          collegeName: 'UIT-RGPV, Bhopal',
          branch: 'Computer Science and Engineering',
          fromYear: 2023,
          toYear: 2027,
        },
      ],
    },
  });

  console.log(`👤 Main user ready: ${mainUser.email} (${mainUser.username})`);

  // 2. Student Candidates for Matchmaking & Social Network
  const dummyUsersData = [
    {
      email: 'priya.patel@rgpv.ac.in',
      username: 'priya_patel',
      fullName: 'Priya Patel',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Computer Science & Engineering',
      about: 'Pre-final year CSE student building PyTorch models and web applications. Passionate about hackathons & generative AI.',
      skills: ['React', 'Python', 'PyTorch', 'Node.js', 'Docker', 'Machine Learning'],
      interests: ['AI/ML', 'Web Development', 'Hackathons', 'Data Science'],
      tags: ['Coder', 'AI Enthusiast', 'Hackathon Winner'],
      profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 92,
      education: [{ id: 'edu-p1', collegeName: 'UIT-RGPV, Bhopal', branch: 'Computer Science and Engineering', fromYear: 2023, toYear: 2027 }],
    },
    {
      email: 'aarav.mehta@rgpv.ac.in',
      username: 'aarav_mehta',
      fullName: 'Aarav Mehta',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Information Technology',
      about: 'UI/UX artisan and frontend engineer. Turning complex design systems into clean, responsive web apps.',
      skills: ['Figma', 'React', 'Tailwind CSS', 'UI/UX Design', 'TypeScript', 'JavaScript'],
      interests: ['Product Design', 'Web Development', 'Design Systems', 'Hackathons'],
      tags: ['Designer', 'Frontend Artisan'],
      profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 88,
      education: [{ id: 'edu-p2', collegeName: 'UIT-RGPV, Bhopal', branch: 'Information Technology', fromYear: 2023, toYear: 2027 }],
    },
    {
      email: 'rohit.verma@rgpv.ac.in',
      username: 'rohit_verma',
      fullName: 'Rohit Verma',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Computer Science & Engineering',
      about: 'Cloud and DevOps wrangler. Working with microservices, Docker, Kubernetes, and scalable PostgreSQL setups.',
      skills: ['Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'Go', 'Linux'],
      interests: ['Cloud Architecture', 'System Design', 'Open Source', 'DevOps'],
      tags: ['DevOps', 'Backend Specialist'],
      profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 90,
      education: [{ id: 'edu-p3', collegeName: 'UIT-RGPV, Bhopal', branch: 'Computer Science and Engineering', fromYear: 2022, toYear: 2026 }],
    },
    {
      email: 'ananya.singh@rgpv.ac.in',
      username: 'ananya_singh',
      fullName: 'Ananya Singh',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Information Technology',
      about: 'Data science explorer working on predictive analytics and conversational agents. Love competitive programming and math.',
      skills: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'TensorFlow', 'Data Science'],
      interests: ['Data Science', 'Research', 'AI/ML', 'Competitive Programming'],
      tags: ['Data Scientist', 'Researcher'],
      profileImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 85,
      education: [{ id: 'edu-p4', collegeName: 'UIT-RGPV, Bhopal', branch: 'Information Technology', fromYear: 2023, toYear: 2027 }],
    },
    {
      email: 'vikram.sharma@rgpv.ac.in',
      username: 'vikram_sharma',
      fullName: 'Vikram Sharma',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Electronics & Communication',
      about: 'CTF player and infosec learner. Building secure network protocols and learning binary exploitation.',
      skills: ['Python', 'Linux', 'Networking', 'Penetration Testing', 'Cryptography', 'C++'],
      interests: ['Cybersecurity', 'Ethical Hacking', 'Networks', 'CTFs'],
      tags: ['Security', 'CTF Player'],
      profileImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 82,
      education: [{ id: 'edu-p5', collegeName: 'UIT-RGPV, Bhopal', branch: 'Electronics & Communication', fromYear: 2023, toYear: 2027 }],
    },
    {
      email: 'neha.gupta@rgpv.ac.in',
      username: 'neha_gupta',
      fullName: 'Neha Gupta',
      collegeName: 'UIT-RGPV, Bhopal',
      headline: 'Computer Science & Engineering',
      about: 'Flutter & mobile enthusiast. Shipped campus apps with 1,000+ active users. Always excited about clean architecture.',
      skills: ['Flutter', 'Dart', 'Firebase', 'React Native', 'REST APIs', 'UI/UX Design'],
      interests: ['Mobile Dev', 'App Design', 'Startups', 'Web Development'],
      tags: ['Mobile Dev', 'App Builder'],
      profileImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      profileCompletePercentage: 89,
      education: [{ id: 'edu-p6', collegeName: 'UIT-RGPV, Bhopal', branch: 'Computer Science and Engineering', fromYear: 2023, toYear: 2027 }],
    },
  ];

  const createdPeers = [];
  for (const u of dummyUsersData) {
    const peer = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        username: u.username,
        about: u.about,
        collegeName: u.collegeName,
        headline: u.headline,
        skills: u.skills,
        interests: u.interests,
        tags: u.tags,
        profileImageUrl: u.profileImageUrl,
        profileCompletePercentage: u.profileCompletePercentage,
        education: u.education,
      },
      create: {
        ...u,
        password: passwordHash,
      },
    });
    createdPeers.push(peer);
  }
  console.log(`👥 Created/Updated ${createdPeers.length} peer students.`);

  // 3. Squads & Group Messages
  const squadsConfig = [
    {
      name: 'AI & ML Innovators',
      description: 'Building deep learning models, LLM pipelines, and computer vision projects for upcoming hackathons.',
    },
    {
      name: 'Hackathon Mavericks',
      description: 'Competitive team collaborating for Smart India Hackathon (SIH) and open innovation challenges.',
    },
    {
      name: 'Full-Stack Guild',
      description: 'Web development enthusiasts sharing knowledge on React, Node.js, Next.js, and cloud backends.',
    },
  ];

  const createdSquads = [];
  for (const sc of squadsConfig) {
    let squad = await prisma.squad.findFirst({ where: { name: sc.name } });
    if (!squad) {
      squad = await prisma.squad.create({
        data: {
          name: sc.name,
          description: sc.description,
          ownerId: mainUser.id,
        },
      });
    }
    createdSquads.push(squad);

    // Add mainUser and peers as members
    const membersToAdd = [mainUser, ...createdPeers.slice(0, 4)];
    for (const mem of membersToAdd) {
      const exists = await prisma.squadMember.findUnique({
        where: { squadId_userId: { squadId: squad.id, userId: mem.id } },
      });
      if (!exists) {
        await prisma.squadMember.create({
          data: {
            squadId: squad.id,
            userId: mem.id,
            role: mem.id === mainUser.id ? 'owner' : 'member',
          },
        });
      }
    }

    // Add sample chat messages in each squad if none exist
    const msgCount = await prisma.squadMessage.count({ where: { squadId: squad.id } });
    if (msgCount === 0) {
      const peerA = createdPeers[0];
      const peerB = createdPeers[1];
      await prisma.squadMessage.createMany({
        data: [
          {
            squadId: squad.id,
            senderId: peerA.id,
            content: `Hey everyone! Welcome to the ${sc.name} squad! 🚀`,
            createdAt: new Date(Date.now() - 3600000 * 5),
          },
          {
            squadId: squad.id,
            senderId: peerB.id,
            content: 'Excited to be here! What are we working on this week?',
            createdAt: new Date(Date.now() - 3600000 * 3),
          },
          {
            squadId: squad.id,
            senderId: mainUser.id,
            content: 'Let\'s finalize our problem statement and dataset by tomorrow evening.',
            createdAt: new Date(Date.now() - 3600000),
          },
        ],
      });
    }
  }
  console.log(`🛡️ Created/Verified ${createdSquads.length} campus squads with group chat history.`);

  // 4. Update Main User Squad Folders & DM Chats (for instant visual richness on Squads page)
  const squadFoldersPayload = [
    {
      id: 'general',
      name: 'General',
      color: 'text-primary',
      bgColor: 'bg-cyan-500',
      members: createdPeers.map((p) => ({
        id: p.id,
        uid: p.id,
        username: p.username,
        name: p.fullName,
        avatar: p.profileImageUrl,
        initials: p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2),
        role: p.headline || 'Student',
        college: p.collegeName,
        connectedVia: 'Matchmaker Connect',
        status: 'online',
      })),
    },
    {
      id: 'hackathon-team',
      name: 'Hackathon Core',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
      members: createdPeers.slice(0, 3).map((p) => ({
        id: p.id,
        uid: p.id,
        username: p.username,
        name: p.fullName,
        avatar: p.profileImageUrl,
        initials: p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2),
        role: p.headline || 'Student',
        college: p.collegeName,
        connectedVia: 'Direct Invite',
        status: 'online',
      })),
    },
  ];

  const firstPeerId = createdPeers[0].id;
  const secondPeerId = createdPeers[1].id;
  const squadChatsPayload = {
    [firstPeerId]: [
      {
        id: 'msg-1',
        text: 'Hey Subham! Saw your matchmaker profile. We have very similar skills in React and Machine Learning!',
        sender: 'them',
        senderId: firstPeerId,
        receiverId: mainUser.id,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        time: '10:15 AM',
      },
      {
        id: 'msg-2',
        text: 'Hey Priya! Thanks for reaching out. Yes, I was looking for someone who works with PyTorch for our upcoming project!',
        sender: 'me',
        senderId: mainUser.id,
        receiverId: firstPeerId,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        time: '11:20 AM',
      },
      {
        id: 'msg-3',
        text: 'Awesome! Let\'s connect after class in the lab to discuss.',
        sender: 'them',
        senderId: firstPeerId,
        receiverId: mainUser.id,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        time: '11:45 AM',
      },
    ],
    [secondPeerId]: [
      {
        id: 'msg-4',
        text: 'Hey! Loved the Figma mockups you shared in the group!',
        sender: 'them',
        senderId: secondPeerId,
        receiverId: mainUser.id,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        time: '09:00 AM',
      },
      {
        id: 'msg-5',
        text: 'Thanks Aarav! Feel free to branch the design file and tweak the components.',
        sender: 'me',
        senderId: mainUser.id,
        receiverId: secondPeerId,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        time: '10:00 AM',
      },
    ],
  };

  await prisma.user.update({
    where: { id: mainUser.id },
    data: {
      squadFolders: squadFoldersPayload,
      squadChats: squadChatsPayload,
    },
  });
  console.log('💬 Populated squad folders and sample DM chats for user.');

  // 5. Posts with Likes and Comments
  const postsData = [
    {
      authorId: createdPeers[0].id, // Priya Patel
      caption: '🏆 1st Place at National Smart Campus Hackathon! Our team designed an edge-AI navigation and attendance assistant for university buildings. Huge thanks to all mentors and friends who tested our beta! 🚀✨',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    },
    {
      authorId: createdPeers[2].id, // Rohit Verma
      caption: 'Late-night sprint at the central computer lab 💻 Submission is in 10 hours and Docker build finally passed without failing cache. Coffee #4 keeping us alive! ☕',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    },
    {
      authorId: mainUser.id, // Subham
      caption: 'CampusConnect is officially live locally! Testing real-time messaging with Socket.io and compatibility matchmaking algorithms. Let us know what features you want next! 🌐⚡',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    },
    {
      authorId: createdPeers[1].id, // Aarav Mehta
      caption: 'Revamping the CampusConnect design system in Figma. Working on ultra-smooth dark and light mode contrasts with accessible cyan accents. How do you like the new UI? 🎨',
      imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    },
    {
      authorId: createdPeers[3].id, // Ananya Singh
      caption: 'Placement season preparation roadmap is here! Structured practice for DSA, DBMS, and behavioral questions. Remember to keep building real projects that stand out on your resume. We got this! 💪📚',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    },
    {
      authorId: createdPeers[5].id, // Neha Gupta
      caption: 'Just published our open-source Flutter campus utility app! Check out the GitHub repository, star it, and submit your PRs. Good first issues are tagged. ⭐📱',
      imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80',
    },
  ];

  for (const pd of postsData) {
    const existing = await prisma.post.findFirst({ where: { caption: pd.caption } });
    if (!existing) {
      const newPost = await prisma.post.create({
        data: pd,
      });

      // Add likes
      const likers = [mainUser, ...createdPeers].slice(0, Math.floor(Math.random() * 4) + 2);
      for (const liker of likers) {
        await prisma.postLike.create({
          data: {
            userId: liker.id,
            postId: newPost.id,
          },
        }).catch(() => {});
      }

      // Add comments
      await prisma.comment.create({
        data: {
          postId: newPost.id,
          authorId: likers[1]?.id || mainUser.id,
          content: 'Huge congratulations! This looks incredible! 🔥',
        },
      }).catch(() => {});

      await prisma.comment.create({
        data: {
          postId: newPost.id,
          authorId: likers[0]?.id || mainUser.id,
          content: 'Super inspiring work, looking forward to trying it out! 👏',
        },
      }).catch(() => {});
    }
  }
  console.log(`📝 Seeded ${postsData.length} campus posts with likes & comments.`);

  // 6. Forum Threads with Votes and Replies
  const threadsData = [
    {
      title: 'How to prepare for campus placement coding rounds & tech interviews?',
      description: 'Senior students & alumni, what was your day-to-day preparation strategy? Which platforms (LeetCode, Codeforces, Striver sheets) yielded the highest ROI for product and service-based companies?',
      tags: ['Placement', 'Career', 'Interview Prep'],
      collegeName: 'UIT-RGPV, Bhopal',
      authorId: createdPeers[0].id,
      upvotes: 24,
      downvotes: 1,
    },
    {
      title: 'Looking for 2 teammates for Smart India Hackathon (SIH 2026) - AI/ML track',
      description: 'We have a strong UI/UX designer and a backend engineer. Looking for someone with PyTorch / HuggingFace experience and someone with IoT/hardware integration skills. Reply here with your profile link!',
      tags: ['Hackathon', 'Collaboration', 'Projects'],
      collegeName: 'UIT-RGPV, Bhopal',
      authorId: mainUser.id,
      upvotes: 18,
      downvotes: 0,
    },
    {
      title: 'Best resources to master System Design and Microservices in 2026?',
      description: 'Looking for recommendations on books, video courses, or interactive platforms to understand distributed caching, Kafka, and sharding without getting overwhelmed. What helped you understand real-world scale?',
      tags: ['System Design', 'Backend', 'Doubt'],
      collegeName: 'UIT-RGPV, Bhopal',
      authorId: createdPeers[2].id,
      upvotes: 31,
      downvotes: 0,
    },
    {
      title: 'Managing 7th & 8th semester Major Project alongside placement prep',
      description: 'For those who balanced both successfully, how did you divide your weekly schedule between project deliverables, coding rounds, and core CS revision? Any time management tips are appreciated.',
      tags: ['Academics', 'Advice', 'Projects'],
      collegeName: 'UIT-RGPV, Bhopal',
      authorId: createdPeers[3].id,
      upvotes: 15,
      downvotes: 1,
    },
    {
      title: 'Hostel Wi-Fi and Library Port Routing Issues - Notice',
      description: 'If you are facing dropped connections on port 22 (SSH) and GitHub pushes from the campus hostel network, changing your DNS to 1.1.1.1 or using HTTPS git remotes resolves the timeout issue. Hope this helps!',
      tags: ['Campus Life', 'Notice', 'Hostel'],
      collegeName: 'UIT-RGPV, Bhopal',
      authorId: createdPeers[4].id,
      upvotes: 42,
      downvotes: 2,
    },
  ];

  for (const td of threadsData) {
    const existing = await prisma.thread.findFirst({ where: { title: td.title } });
    if (!existing) {
      const newThread = await prisma.thread.create({
        data: td,
      });

      // Add comments on thread
      await prisma.comment.create({
        data: {
          threadId: newThread.id,
          authorId: mainUser.id,
          content: 'Great discussion! Practicing Striver A2Z sheet and 2 LeetCode mediums daily helped me build consistent problem-solving speed.',
        },
      }).catch(() => {});

      await prisma.comment.create({
        data: {
          threadId: newThread.id,
          authorId: createdPeers[1].id,
          content: 'Count me in for the hackathon team! Just sent you a connection request on CampusConnect.',
        },
      }).catch(() => {});
    }
  }
  console.log(`🧵 Seeded ${threadsData.length} campus forum threads with active discussions.`);

  console.log('✅ Seeding completed successfully! All campus data is live.');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
