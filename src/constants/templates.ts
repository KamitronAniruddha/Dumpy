export interface QuestionTemplate {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  questions: QuestionTemplate[];
  icon: string;
}

export const QUIZ_TEMPLATES: QuizTemplate[] = [
  {
    id: 'anniversary',
    title: 'Anniversary Quiz',
    description: 'Celebrate your journey together with questions about your milestones.',
    icon: 'Calendar',
    questions: [
      {
        text: 'On what date did we officially start dating?',
        options: ['[Date 1]', '[Date 2]', '[Date 3]', '[Date 4]'],
        correctOptionIndex: 0
      },
      {
        text: 'Where was our very first anniversary celebrated?',
        options: ['At a restaurant', 'At home', 'On a trip', 'We forgot!'],
        correctOptionIndex: 0
      },
      {
        text: 'What was the first gift I ever gave you?',
        options: ['Flowers', 'Jewelry', 'A book', 'Something handmade'],
        correctOptionIndex: 0
      },
      {
        text: 'How many months/years have we been together now?',
        options: ['1 Year', '2 Years', '5 Years', 'Too many to count!'],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'first-date',
    title: 'First Date Memories',
    description: 'Take a trip down memory lane to the day it all began.',
    icon: 'Heart',
    questions: [
      {
        text: 'Where did we go on our first date?',
        options: ['Coffee Shop', 'Movie Theater', 'Park', 'Restaurant'],
        correctOptionIndex: 0
      },
      {
        text: 'What was I wearing on our first date?',
        options: ['Something blue', 'Something red', 'Something black', 'I don\'t remember!'],
        correctOptionIndex: 0
      },
      {
        text: 'Who spoke first when we met for the date?',
        options: ['Me', 'You', 'We spoke at the same time', 'A waiter/third party'],
        correctOptionIndex: 0
      },
      {
        text: 'What was the first thing we ate/drank together?',
        options: ['Coffee', 'Pizza', 'Ice Cream', 'Wine'],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'favorite-things',
    title: 'Favorite Things About Us',
    description: 'A fun quiz about our shared favorites and little quirks.',
    icon: 'Sparkles',
    questions: [
      {
        text: 'What is our "special" song?',
        options: ['[Song 1]', '[Song 2]', '[Song 3]', 'We don\'t have one yet'],
        correctOptionIndex: 0
      },
      {
        text: 'What is my favorite meal that you cook?',
        options: ['Pasta', 'Breakfast', 'Steak', 'Everything!'],
        correctOptionIndex: 0
      },
      {
        text: 'Where is our favorite place to go on weekends?',
        options: ['The Beach', 'The Movies', 'The Mall', 'Just staying in bed'],
        correctOptionIndex: 0
      },
      {
        text: 'What is the one thing I do that always makes you laugh?',
        options: ['My jokes', 'My dancing', 'My faces', 'My clumsiness'],
        correctOptionIndex: 0
      }
    ]
  }
];
