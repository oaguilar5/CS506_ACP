import React from 'react';
import { shallow } from 'enzyme';
import PP from './../PP.jsx';


test('should test Login component', () => {
    const wrapper = shallow(<PP />);
    expect(wrapper).toMatchSnapshot();
});