/* ------------------------------------------------------------------ */
/*  Image asset map — generated from the files in public/images.        */
/*                                                                     */
/*  Every photograph the site uses is registered here with its real     */
/*  dimensions, alt text and a tiny inline LQIP, so callers never guess  */
/*  a path and no image can shift layout while it loads.                 */
/* ------------------------------------------------------------------ */

export interface ImageAsset {
  src: string;
  width: number;
  height: number;
  /** Descriptive alt text. Pass "" explicitly when the image is decorative. */
  alt: string;
  /** Inline LQIP used as the Next.js blur placeholder. */
  blurDataURL: string;
  /** Focal point to keep in frame when the image is cropped. */
  position: string;
}

export const IMAGES = {
  heroStudentLearning: {
    src: "/images/hero/hero-student-learning.webp",
    width: 1672,
    height: 941,
    alt: "A student working through an internship module on a laptop in a bright, open learning space",
    position: "center 35%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFBv/EACIQAAICAgEDBQAAAAAAAAAAAAECAxEABCESEzEFBhQyQf/EABYBAQEBAAAAAAAAAAAAAAAAAAEAAv/EABkRAAIDAQAAAAAAAAAAAAAAAAABERJRMf/aAAwDAQACEQMRAD8AfT1KGWJI5Ii71yqjqPGSdndSSaZI07DuelQvNVybvx4ytLEmr7c2DrjtEqzEoSDdDnMRDsS/MB7jEsTd83mkuhhQj6dqMSilB/KvDGRM7Rx2QaWvqMMZelVH/9k=",
  },
  selfPacedLearning: {
    src: "/images/programs/self-paced-learning.webp",
    width: 1672,
    height: 941,
    alt: "A student reading through structured module material at a sunlit desk, notebook open beside a laptop",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUBAgME/8QAJBAAAQMEAQMFAAAAAAAAAAAAAQIDEQAEBRIhEyJRFDFBYXH/xAAWAQEBAQAAAAAAAAAAAAAAAAACAAH/xAAZEQEAAgMAAAAAAAAAAAAAAAAAARICEVH/2gAMAwEAAhEDEQA/AGeQzSOktror3IMCRChHx+UlyWbZ9a2tgO9EDvQlAgmfNc2HecVb3BU4owExz5963Yu3jbBO4CSOQEgUbdbjCE3DAHasuA8zwmPqIoquUZbbuE6ISnZAJ1EcyaKqwW3/2Q==",
  },
  industryLedMentor: {
    src: "/images/programs/industry-led-mentor.webp",
    width: 1672,
    height: 941,
    alt: "A working professional walking a small group of interns through a live session in a meeting room",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAQFAwb/xAAjEAACAQMDBAMAAAAAAAAAAAABAgMABBEFITEGEhNBYZGx/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQAC/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAESAv/aAAwDAQACEQMRAD8AhXN0HuneSMEBVVlz7A3NaW92UhkkIXxLgoTz72qSpID4PPP3XQWEaT6KryKGZHIVsbgBhj9NatoJTHk6mYxqYtNaRSM90a5HyKKX1CZ4ropGxVQBgDYCii9FGT//2Q==",
  },
  practicalProject: {
    src: "/images/programs/practical-project.webp",
    width: 1672,
    height: 941,
    alt: "Three interns building a practical project together across laptops, notes and hardware on a shared desk",
    position: "center 45%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAQFAwb/xAAiEAACAQMEAgMAAAAAAAAAAAABAgMABBEFEiExFGFCkbH/xAAWAQEBAQAAAAAAAAAAAAAAAAADAQL/xAAYEQADAQEAAAAAAAAAAAAAAAAAAQISEf/aAAwDAQACEQMRAD8AgJcRzm4n2MvGFiXBC+6divLiKEzqhicdFQCFA9VDgdonLoSrY7FdRpMz32nE3e2U7QMsoz91KrhqZTHE1+V41YWoORz2fyisLSJfGUgsMls4Yj5Gih0Jk//Z",
  },
  domainAiMl: {
    src: "/images/domains/domain-ai-ml.webp",
    width: 1672,
    height: 941,
    alt: "An intern studying model and network visualisations across a multi-monitor workstation",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAMFBAb/xAAhEAACAgICAgMBAAAAAAAAAAABAgMRAAQFMRIhQWGBof/EABYBAQEBAAAAAAAAAAAAAAAAAAEAAv/EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAwDAQACEQMRAD8A5V2COoVXIIsn5/Mo6vKbEMIi1JHQKQSpUEg9d5h1tmaMoUkYEI1fWMMrTa7SyEGSwPKgM1KsNm5rkFe325lLCx4+gR1f8wyazsT7N11YwxD/2Q==",
  },
  domainDataAnalytics: {
    src: "/images/domains/domain-data-analytics.webp",
    width: 1672,
    height: 941,
    alt: "An analyst reading dashboards and charts across several screens",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAUCAwT/xAAlEAACAQMCBQUAAAAAAAAAAAABAgMAERIEIQUTIjEyFGGBsfD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAf/EABkRAAMBAQEAAAAAAAAAAAAAAAABEQIhEv/aAAwDAQACEQMRAD8ART8SSbURlGaNSetQe9S1OTu+d2ze+wtf8KVzgc1jYeZ+zW/g2plwePPpGwFu1L12knIWeklJOCMo+N/eim+k08bxEsCbG3kaKL06JZR//9k=",
  },
  domainSoftwareDevelopment: {
    src: "/images/domains/domain-software-development.webp",
    width: 1672,
    height: 941,
    alt: "A developer writing and reviewing code across a multi-screen setup",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEBf/EACIQAAIBBAEEAwAAAAAAAAAAAAECAwAEETGREhQhIiNhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAEA/8QAGBEAAwEBAAAAAAAAAAAAAAAAABESASH/2gAMAwEAAhEDEQA/AMS4uCsj9DqylcEgc7/aXczCGzQLKyuw8Ebx981TentHljg9UGl2BzWQzGSJ3fBbIGcU0xlDg1v0j5Hzjz6aPNFRCip6HD//2Q==",
  },
  domainSoftwareTesting: {
    src: "/images/domains/domain-software-testing.webp",
    width: 1672,
    height: 941,
    alt: "A test engineer working through test cases and quality checklists on screen",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFBv/EACEQAAICAgIDAAMAAAAAAAAAAAECAxEABAUhEiIxE0Fx/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgAB/8QAGREAAgMBAAAAAAAAAAAAAAAAAAEDESES/9oADAMBAAIRAxEAPwCHtcom3HFEbT2Jcr113Qx+BdKLjW8kf88tmLxN0R8sD5+8zN+x/uP8VvbEbKiykLdVQPWb1WlV4U9CWRta4oGlWzTBsMs8dDGut6qBZJwwuRjUSP/Z",
  },
  studentJourney: {
    src: "/images/students/student-journey.webp",
    width: 1672,
    height: 941,
    alt: "A student walking through a campus atrium on the way to a session",
    position: "center 45%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMFBP/EACEQAAICAgIDAAMAAAAAAAAAAAECAxEABAUSEyFRMXHB/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAEREv/aAAwDAQACEQMRAD8AfByW7twmNIHik6En1QFA1f7ybMkhihafVLNIiSMbHU/g/wBx/AsfOzXbdlFn5m/lJGiGwiUFQoFBANC8zakLTtJz7vGxt1fjYWP1JLGGK3ifKtEgdB6BoYY5YaR//9k=",
  },
  studentCommunity: {
    src: "/images/students/student-community.webp",
    width: 1672,
    height: 941,
    alt: "A group of students working together on a campus terrace",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAQFAgP/xAAiEAACAQMEAgMAAAAAAAAAAAABAgMAESEEBRIxQVEycYH/xAAVAQEBAAAAAAAAAAAAAAAAAAACA//EABkRAAMAAwAAAAAAAAAAAAAAAAABEQIhMf/aAAwDAQACEQMRAD8A66nf0aMLGjSM1yFZ+sWz++KU0+4K8pEsC5N47/EYOL/dY29Ed+LRoeRNzxF+/fdVdVt+ljZo0hCogHEAnGam2uFFjRCHVtKnJElW5yolUWPnuioW4SMNW9iBk9AezRSjDo//2Q==",
  },
  studentDashboard: {
    src: "/images/students/student-dashboard-lifestyle.webp",
    width: 1672,
    height: 941,
    alt: "A student checking internship progress on a dashboard at a home desk",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQAG/8QAIhAAAgICAgICAwAAAAAAAAAAAQIDEQAEEiEFQSKhkcHw/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABcRAAMBAAAAAAAAAAAAAAAAAAABESH/2gAMAwEAAhEDEQA/ABX2daXeEKSSjXVyVblxs+rr+7xrTeabeuE3GoJAcgEdV+/vMprqH2WDAEcCfrNR4pVDrHxUoEsBhdfnC5RKtCHlPKLJtWOviPeWFb88seyQjlQRdDrLEqHD/9k=",
  },
  certificateAchievement: {
    src: "/images/certificate/certificate-achievement.webp",
    width: 1672,
    height: 941,
    alt: "A graduate holding an internship completion certificate inside a learning space",
    position: "center 35%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUCAwQG/8QAIhAAAQMFAAEFAAAAAAAAAAAAAQIDEQAEEiFBkQUTMTKB/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQID/8QAGBEAAwEBAAAAAAAAAAAAAAAAAAERYYH/2gAMAwEAAhEDEQA/AIetX7N5aNFhOJEElOjEdP5Su8ubd51KySTcIkjKQDMQrxWWzHuONoWVFIP1kx3lUr0tgDQ2qBwzzxURGlZ0jGLjKFJckYgaXRSMXb6QMXVCdnfyaKZgdP/Z",
  },
  certificateVerification: {
    src: "/images/certificate/certificate-verification.webp",
    width: 1672,
    height: 941,
    alt: "A certificate on a desk beside a phone showing a verified check after scanning its QR code",
    position: "center 50%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAABAADBf/EACMQAAICAgIBBAMAAAAAAAAAAAECAxEABBIhBRMiQXEjMWH/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIhERJR/9oADAMBAAIRAxEAPwA2xobGxNJPsb2r6Xx+azQHQv4ziywngQsytxf2lTanrs3i/PgDyYYAW9E/eG241jnj4CuUKk/217wqYdoG8jqaZlJ+8s0ZFarH6GWabS6ThH//2Q==",
  },
  collegePartnership: {
    src: "/images/college/college-partnership.webp",
    width: 1672,
    height: 941,
    alt: "Students at a campus internship drive talking with programme coordinators",
    position: "center 45%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFAv/EACMQAAIBAwQBBQAAAAAAAAAAAAECAwAEEQUSISNhEyIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAACA//EABgRAQEBAQEAAAAAAAAAAAAAAAEAEQIh/9oADAMBAAIRAxEAPwBCDV5A3Wp2l/b8ZUflUE1uRraZmeR0Rjlzx98UtY2dvNq15BJErRLMwCEcDGMVRmtYX227J0tCzFASBkDiich6S3bccvTH6yW7yFQWbfgE+KKk2bsbWPLMcDHJ80VYQjm3/9k=",
  },
  foundationCampus: {
    src: "/images/foundation/roystian-foundation-campus.webp",
    width: 1672,
    height: 941,
    alt: "The Roystian Foundation campus at golden hour with students walking between buildings",
    position: "center 50%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAQCBQb/xAAiEAACAgEDBAMAAAAAAAAAAAABAgMEAAURITFBcbESI5H/xAAWAQEBAQAAAAAAAAAAAAAAAAADAAH/xAAYEQADAQEAAAAAAAAAAAAAAAAAARExUf/aAAwDAQACEQMRAD8AYq63XipqpiBmUbHkd/eI2dQW1JtajJAOwVWIXyRlnDXiSqCsagmMA8decz9wCG4ViAUbDp5OAsorGmtQxnZI0K9vih29jDIxfZGGbk/mGbX0j//Z",
  },
  sustainability: {
    src: "/images/foundation/sustainability.webp",
    width: 1672,
    height: 941,
    alt: "Students testing solar and wind models on a planted rooftop research space",
    position: "center 45%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAQBAgP/xAAkEAACAQMDAwUAAAAAAAAAAAABAgMABBEFEiExQVETI3GCof/EABYBAQEBAAAAAAAAAAAAAAAAAAECA//EABgRAAMBAQAAAAAAAAAAAAAAAAABAhEh/9oADAMBAAIRAxEAPwBOa/kZWEdqe+31FGOe+Kdi1SeOBduY0J4CYG74NRcIsUkZRQCy7ScdR4/avbe9CiSAMu0kAjp2rCaW4hZour3RXKzYHgsOKKXbT7YdIsfY0VLro9P/2Q==",
  },
  careerOpportunities: {
    src: "/images/career/career-opportunities.webp",
    width: 1672,
    height: 941,
    alt: "A recent graduate walking into a workday through a modern business district",
    position: "center 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEBf/EACMQAAEDBQABBQEAAAAAAAAAAAECAxEABAUSIVEGEzFhscH/xAAVAQEBAAAAAAAAAAAAAAAAAAACAf/EABgRAQADAQAAAAAAAAAAAAAAAAEAAhEx/9oADAMBAAIRAxEAPwCFNyWmdVI2cCgUJiFGDzvia2MVkGmVXVsp5KfbPFEztwGf5U9ydbV1sAa6K5H1S/TyQjFNlIAKnYPPkFUflE0rHgsbkci2q9cLbqAmeSKKzs2S1lHm2zCEGEjwKKpa2dhamz//2Q==",
  },
  futureCareer: {
    src: "/images/career/future-career.webp",
    width: 1672,
    height: 941,
    alt: "A student looking out over a city skyline at sunrise, laptop bag on their shoulder",
    position: "center 45%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAUBBAb/xAAjEAABBAEDBAMAAAAAAAAAAAABAAIDEQUEEiEiMUFRcaHR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABgRAAMBAQAAAAAAAAAAAAAAAAACUQES/9oADAMBAAIRAxEAPwB47IY4ssyx/AKXa/J4+CAytIfTgOL8n8srP0PQ8KNbEw4yR23noP2grNR7iwZza2ASHa+Lb3BIcbHtCqFrRLI2gQ11C+aFdkJ9vQ8LD//Z",
  },

  /* --- Team headshots (About page) --- */
  teamKiranBavikatti: {
    src: "/images/team/kiran-bavikatti.webp",
    width: 800,
    height: 800,
    alt: "Kiran Bavikatti, Founder and CEO of Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAGgABAAIDAQAAAAAAAAAAAAAAAAMFAQIEBv/EACYQAAEDBAECBwEAAAAAAAAAAAEAAgMEERIhQRMxBQYUMmGBkdH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQMC/8QAGhEAAwADAQAAAAAAAAAAAAAAAAERAhIxIf/aAAwDAQACEQMRAD8A5aaDMBrdE6Bt2WslMYKmNrJpZGu9wkZbg2t+IyojYBGXHJ2hbuFE+Ofw93qKlxkZl02AEgk22bHn+p5Wr0eM1dRLJAMuyLBr6d2+pb4I2ipUSjKxziJyecleecHnOjbxg533pEWH0ouHlS4koiJAf//Z",
  },
  teamTejasreeAkula: {
    src: "/images/team/tejasree-akula.webp",
    width: 800,
    height: 800,
    alt: "Tejasree Akula, Managing Director of Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUCBP/EACYQAAIBAwIGAgMAAAAAAAAAAAECAwAEERITBSEiMVFxBkFhwdH/xAAWAQEBAQAAAAAAAAAAAAAAAAADAAL/xAAZEQADAQEBAAAAAAAAAAAAAAAAARFhAiH/2gAMAwEAAhEDEQA/AKHD2WNZ5GPSq6j651Nu7uYvA91p0Stp2sEGLPb3XBBc3DbllbAtLcdGSe3ms8XkkjvlgaXWICC2O2v7o+U/BKnWy1eQQ7ikozEouTk+KVPe4eciRWAVhkDJ5UpLgc0fE23eNSSuAXCMwP5JH9qJcyNNcPI5yzuWPulKiKloM2sefH7pSlZNH//Z",
  },
  teamLakshmikanthRajuMakka: {
    src: "/images/team/lakshmikanth-raju-makka.webp",
    width: 800,
    height: 800,
    alt: "Lakshmikanth Raju Makka, Growth and Revenue Head at Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUGAv/EACQQAAICAQIFBQAAAAAAAAAAAAECAAMRBSEEExQiUQYSMUFh/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgEA/8QAGBEBAQEBAQAAAAAAAAAAAAAAAQACIRH/2gAMAwEAAhEDEQA/AO9c9405Onaw2G1gDjBG5zJdNXGUcluoruFuA9ZYtgH7lM6grNTSGRrWtPaN/nM56kivD2FQWC5tAUAwafHk8HFa1w6ryu3OASN4kZdV4hMh8nc4KjIxEokLOoxSxXU4ZSCD+zXeqaK10vmKoDtapJ87GIjrZEXWV7I7KPAMRE1L/9k=",
  },
  teamAsmithaEnugala: {
    src: "/images/team/asmitha-enugala.webp",
    width: 800,
    height: 800,
    alt: "Asmitha Enugala, Operations, Growth and Revenue Associate at Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAQFAQf/xAAiEAACAgIDAAEFAAAAAAAAAAABAgADBBEFEiFREzFBkqH/xAAVAQEBAAAAAAAAAAAAAAAAAAADAv/EABkRAAMBAQEAAAAAAAAAAAAAAAABAiEyEf/aAAwDAQACEQMRAD8Astyxhca93XsxsZUX5YnyR1ZnJ4ltb8iqHHsbqxAG69/aQcjnbfDZx2pW5nIB9Pss5bIrq49iVLdh0rBbYG/mHVbgkSnPrN36cTmPZ3x6m3vaA/yIoR57kWPYezsWYk7Jm/zXvDYZJ3vW/wBYiHXSFnlmOmVeihVtcAfjcREsM//Z",
  },
  teamSushmajaIntha: {
    src: "/images/team/sushmaja-intha.webp",
    width: 800,
    height: 800,
    alt: "Sushmaja Intha, Operations, Growth and Revenue Associate at Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAGQABAAMBAQAAAAAAAAAAAAAAAAQFBgMH/8QAJRAAAQQBAwMFAQAAAAAAAAAAAQACAwQRBRIxBiGhQUJRcXOR/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgED/8QAGBEBAQEBAQAAAAAAAAAAAAAAAAESAhH/2gAMAwEAAhEDEQA/ALnVbZpU3SRgOlcQyNp9XHhQKFm1HdjhszmdkzTguj27H84/iruptUbLIK0IINeTcX59w+F11OSbTrFCzJlzQ4uLeM9h57qW3UPmTN9aTCKPRuR36zZ4chpJGHcghFoyefyPdJLK5xyXOJP2tL1aSaum/mT4aiInVdpFuaGq5sbsDeT4CIiov//Z",
  },
  teamPSairamreddy: {
    src: "/images/team/p-sairamreddy.webp",
    width: 800,
    height: 800,
    alt: "P. Sairamreddy, Software and College Partnerships Lead at Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUDBP/EACYQAAEDAwMEAgMAAAAAAAAAAAEAAgMEESESIjEFBnGBE0Fh0eH/xAAXAQEBAQEAAAAAAAAAAAAAAAADBAAB/8QAGBEBAQADAAAAAAAAAAAAAAAAAQACITH/2gAMAwEAAhEDEQA/AKcul9TOQQdsfHlywgnnFbpcI/jzgA6m24z+VN7gq3trjFDK5l2DXpNrnP7W3Wwelx0j6d5bLI3eebgAc+13MVtggbrTpLlFLp6iSeBklzuF8M/qINEm6ZUxtk7ifC4bJKgB3i67u8M1lGCMaHY9oipYjll06V7KGIA/R58lERTZdZTl/9k=",
  },
  teamArepalliChandrakanth: {
    src: "/images/team/arepalli-chandrakanth.webp",
    width: 800,
    height: 800,
    alt: "Arepalli Chandrakanth, Backend Development Software Professional at Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAQGA//EACcQAAICAgEBBwUAAAAAAAAAAAECAAMEERIhBSIxQVFhgQYTFHGR/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgAD/8QAGREBAQEBAQEAAAAAAAAAAAAAAQAREjFR/9oADAMBAAIRAxEAPwCq6y0/kBURra15JoHbH32ZLQc6nKFb3rkpaCbO4V4aHiD8Sds1ez8izjYchgdHpof2W3WvhI2XdyuqtVVUjprY3v38IAd8mYjtdbXll+4wA9NiJzrbHzK1uqyawreTniQf1EfR9s+WyLOz3PyO/OabKP3Poupm6lQuvhtRE0as3jXuiMFI1y9IiIav/9k=",
  },
  teamLaxmiprasannaPathuri: {
    src: "/images/team/laxmiprasanna-pathuri.webp",
    width: 800,
    height: 800,
    alt: "Laxmiprasanna Pathuri, AI/ML Engineer at Roystian Foundation",
    position: "center 30%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAUABQDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAUGAQT/xAAmEAACAgIBAwIHAAAAAAAAAAABAgADBBEFEhMUIVEGMTJBYrHR/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAID/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAERMf/aAAwDAQACEQMRAD8Ap5eQ2Nx5aobtdylY/IsZ4qLLcbNx1a6+2q49L94fJiNgj+SdzXJk1V4tfUtlFhZ2JH1D2neSyLqRx+QT6Fu4F36E6Bk3rSZlakCJPw+axsqovpqyDoq2olIYu1jZbaznZLEk+8t/EJPi8Sv28ff6iIEEMw3okREQP//Z",
  },
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof IMAGES;

/**
 * Domain id -> photograph. Twelve domains share a smaller photo set, so
 * related tracks intentionally reuse the same image rather than shipping a
 * stock picture that says nothing about the work.
 */
export const DOMAIN_IMAGE: Record<string, ImageAsset> = {
  "ai-ml": IMAGES.domainAiMl,
  "data-analytics": IMAGES.domainDataAnalytics,
  "business-analytics": IMAGES.domainDataAnalytics,
  "full-stack-development": IMAGES.domainSoftwareDevelopment,
  "software-testing": IMAGES.domainSoftwareTesting,
  "python-development": IMAGES.domainSoftwareDevelopment,
  "java-development": IMAGES.domainSoftwareDevelopment,
  "iot-electronics": IMAGES.domainAiMl,
  "sustainability": IMAGES.sustainability,
  "sales-marketing": IMAGES.careerOpportunities,
  "mechanical-engineering": IMAGES.practicalProject,
  "software-development": IMAGES.domainSoftwareDevelopment,
};

export function domainImage(domainId: string): ImageAsset {
  return DOMAIN_IMAGE[domainId] ?? IMAGES.heroStudentLearning;
}
